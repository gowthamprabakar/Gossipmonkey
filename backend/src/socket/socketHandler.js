import crypto from 'crypto';
import { verifySessionToken } from '../services/authService.js';
import { generateImage } from '../services/imageService.js';
import {
  ensureRoomJoinAllowed,
  markJoined,
  markLeft,
  listParticipants,
  getRecentMessages,
  canSendMessage,
  createMessage,
  toggleReaction,
  flagMessage,
  deleteMessageByAdmin,
  tipUser,
  kickUser,
  unbanUser,
  listBannedUsers,
  listRoomFlags,
  resolveFlag,
  isRoomAdmin,
  updateRoomSettings,
  deleteRoomByAdmin,
  getRoomById,
  getMessageById
} from '../services/roomService.js';
import { getPersonaById, updatePersonaScore } from '../services/identityService.js';
import {
  analyzeMessage,
  enqueueJob,
  handleHook,
  startHeartbeat,
  stopHeartbeat,
  restartHeartbeat,
  resetMonkeyMemory,
  appendRoomHistory,
  topUpMonkeyBank,
  getMonkeyBankBalance
} from '../services/monkeyService.js';
import { registerCrons, unregisterCrons, reregisterCrons } from '../services/monkeyScheduler.js';

const pendingKnocks = new Map();

const ensureSocketAuth = (socket) => {
  const token = socket.handshake.auth?.token;
  const persona = verifySessionToken(token);
  if (!persona) return null;
  return {
    id: persona.id,
    name: persona.alias,
    avatar: persona.avatar,
    score: persona.score
  };
};

const emitRoomSnapshot = (io, roomId) => {
  io.in(roomId).emit('participants_updated', { roomId, participants: listParticipants(roomId) });
};

export const configureSocket = (io) => {
  io.use((socket, next) => {
    const persona = ensureSocketAuth(socket);
    if (!persona) return next(new Error('Unauthorized'));
    socket.data.persona = persona;
    return next();
  });

  io.on('connection', (socket) => {
    const persona = socket.data.persona;

    socket.emit('system_status', {
      aiAvailable: true,
      reason: null
    });

    socket.on('join_room', ({ roomId }) => {
      try {
        const { room } = ensureRoomJoinAllowed({ roomId, personaId: persona.id });

        if (room.settings.approvalRequired && room.creatorId !== persona.id) {
          const knock = { socketId: socket.id, persona, roomId };
          const existing = pendingKnocks.get(roomId) || [];
          pendingKnocks.set(roomId, [...existing.filter((x) => x.persona.id !== persona.id), knock]);

          io.in(roomId).emit('knock_request', { socketId: socket.id, persona });
          socket.emit('knock_pending', { message: 'Waiting for admin approval...' });
          return;
        }

        socket.join(roomId);
        markJoined({ roomId, personaId: persona.id });
        socket.emit('entry_granted', { roomId });
        socket.emit('room_history', { roomId, messages: getRecentMessages(roomId) });
        emitRoomSnapshot(io, roomId);

        socket.to(roomId).emit('system_message', {
          id: `sys-${Date.now()}`,
          text: `${persona.name} entered the room.`,
          type: 'info',
          timestamp: new Date().toISOString()
        });

        // Start heartbeat + register crons on first join
        const mc = room.monkeyConfig;
        startHeartbeat(io, roomId, mc);
        registerCrons(io, roomId, mc);

        // Welcome message (static, immediate — only for non-admin joiners)
        const welcomeMsg = mc?.welcomeMessage?.trim();
        if (welcomeMsg && room.creatorId !== persona.id) {
          const monkeyName = mc?.name || 'Gossip Monkey';
          const avatarSeed = mc?.avatarSeed || 'Gossip';
          setTimeout(() => {
            socket.emit('receive_message', {
              id: `welcome-${Date.now()}-${crypto.randomUUID()}`,
              text: welcomeMsg.replace('{name}', persona.name),
              type: 'monkey_action',
              timestamp: new Date().toISOString(),
              sender: {
                id: 'monkey-ai-admin',
                name: monkeyName,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`,
                role: 'admin'
              },
              reactions: {}
            });
          }, 800);
        }

        // Hook: user_joined — AI-generated greeting (queued, fires after static welcome)
        if (room.creatorId !== persona.id) {
          enqueueJob(roomId, {
            type: 'hook',
            execute: () => handleHook(io, roomId, 'user_joined', { targetName: persona.name }, mc)
          });
        }

      } catch (error) {
        socket.emit('entry_denied', { message: error.message });
      }
    });

    socket.on('approve_entry', ({ socketId, roomId, approved }) => {
      try {
        if (!isRoomAdmin({ roomId, personaId: persona.id })) {
          socket.emit('system_message', { type: 'alert', text: 'Only admin can approve entry.' });
          return;
        }

        const queue = pendingKnocks.get(roomId) || [];
        const knock = queue.find((k) => k.socketId === socketId);
        pendingKnocks.set(roomId, queue.filter((k) => k.socketId !== socketId));

        let target = io.sockets.sockets.get(socketId);
        if (!target && knock?.persona?.id) {
          target = [...io.sockets.sockets.values()].find((candidate) => (
            candidate.data?.persona?.id === knock.persona.id
          ));
        }
        if (!target || !knock) return;

        if (!approved) {
          target.emit('entry_denied', { message: 'Admin denied your entry.' });
          return;
        }

        target.join(roomId);
        markJoined({ roomId, personaId: knock.persona.id });
        target.emit('entry_granted', { roomId });
        target.emit('room_history', { roomId, messages: getRecentMessages(roomId) });

        io.in(roomId).emit('system_message', { text: `${knock.persona.name} was approved to join.`, type: 'success' });
        emitRoomSnapshot(io, roomId);

        // Hook: user_joined for approval-gate entries (goes through queue)
        enqueueJob(roomId, {
          type: 'hook',
          execute: () => {
            const r = getRoomById(roomId);
            return handleHook(io, roomId, 'user_joined', { targetName: knock.persona.name }, r?.monkeyConfig);
          }
        });
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('send_message', async ({ roomId, text, imageUrl, replyToId }) => {
      try {
        const cleanText = String(text || '');
        const cleanImageUrl = String(imageUrl || '').trim();

        canSendMessage({ roomId, personaId: persona.id, text: cleanText, imageUrl: cleanImageUrl });

        const userMessage = createMessage({
          roomId,
          senderId: persona.id,
          text: cleanText || (cleanImageUrl ? 'Shared an image' : ''),
          imageUrl: cleanImageUrl || null,
          type: cleanImageUrl ? 'image' : 'user'
        });
        io.in(roomId).emit('receive_message', userMessage);

        // Skip AI analysis for image-only messages or /paint commands
        if (cleanText.startsWith('/paint ')) {
          if (persona.score < 10) {
            socket.emit('system_message', { type: 'alert', text: 'INSUFFICIENT_FUNDS: Image generation requires 10 bananas.' });
            return;
          }

          const prompt = cleanText.replace('/paint ', '').trim();
          io.in(roomId).emit('system_message', { type: 'info', text: `${persona.name} is painting... (-10 bananas)` });

          // Deduct cost
          const updatedPersona = updatePersonaScore(persona.id, -10);
          io.in(roomId).emit('balance_update', { userId: persona.id, newScore: updatedPersona.score });

          const generatedImageUrl = await generateImage(prompt);
          if (generatedImageUrl) {
            const artMessage = createMessage({
              roomId,
              senderId: persona.id,
              text: `Art: ${prompt}`,
              imageUrl: generatedImageUrl,
              type: 'image'
            });
            io.in(roomId).emit('receive_message', artMessage);

            // Hook: paint_triggered — always reads fresh config inside execute
            enqueueJob(roomId, {
              type: 'hook',
              execute: () => {
                const r = getRoomById(roomId);
                return handleHook(io, roomId, 'paint_triggered', { userName: persona.name }, r?.monkeyConfig);
              }
            });
          }
        } else if (cleanText.trim()) {
          // Analyze non-empty text messages for Monkey response
          const room = getRoomById(roomId);
          const result = await analyzeMessage({
            io,
            roomId,
            messageData: { text: cleanText, sender: persona },
            monkeyConfig: room?.monkeyConfig
          });
          if (!result.available) {
            io.in(roomId).emit('system_status', { aiAvailable: false, reason: result.reason });
            if (cleanText.toLowerCase().includes('monkey')) {
              socket.emit('system_message', { type: 'alert', text: 'Monkey AI is currently unavailable. Start Ollama to enable replies.' });
            }
          } else {
            io.in(roomId).emit('system_status', { aiAvailable: true, reason: null });
            if (result.rewardedUserId && Number.isFinite(result.rewardedScore)) {
              const rewardAmount = Number(room?.monkeyConfig?.aiRewardAmount ?? 2);
              io.in(roomId).emit('balance_update', { userId: result.rewardedUserId, newScore: result.rewardedScore });
              io.in(roomId).emit('system_message', {
                type: 'success',
                text: `${persona.name} earned +${rewardAmount} 🍌 from Monkey AI.`
              });
            }
          }
        } else if (cleanImageUrl) {
          // Hook: image_shared — fires when user sends image-only message
          enqueueJob(roomId, {
            type: 'hook',
            execute: () => {
              const r = getRoomById(roomId);
              return handleHook(io, roomId, 'image_shared', { userName: persona.name }, r?.monkeyConfig);
            }
          });
        }
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('react_message', ({ roomId, messageId, reaction }) => {
      try {
        const updated = toggleReaction({ roomId, messageId, reaction, personaId: persona.id });
        io.in(roomId).emit('message_updated', updated);
        const message = getMessageById(messageId);
        if (message) {
          const targetPersona = getPersonaById(message.sender_id);
          if (targetPersona) {
            io.in(roomId).emit('balance_update', { userId: targetPersona.id, newScore: targetPersona.score });
          }
        }
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('flag_message', ({ roomId, messageId }) => {
      try {
        flagMessage({ roomId, messageId, flaggedBy: persona.id });
        const flags = listRoomFlags(roomId);
        io.in(roomId).emit('flags_updated', { roomId, flags });

        // Provide UI feedback to the flagger
        socket.emit('system_message', {
          type: 'success',
          text: 'Message flagged for review.'
        });
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('resolve_flag', ({ roomId, flagId }) => {
      try {
        resolveFlag({ roomId, flagId, requesterId: persona.id });
        io.in(roomId).emit('flags_updated', { roomId, flags: listRoomFlags(roomId) });
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('delete_message', ({ roomId, messageId }) => {
      try {
        deleteMessageByAdmin({ roomId, messageId, requesterId: persona.id });
        io.in(roomId).emit('message_deleted', { messageId });
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('tip_user', ({ roomId, toUserId, amount }) => {
      try {
        const result = tipUser({ roomId, fromUserId: persona.id, toUserId, amount: Number(amount || 0) });

        io.in(roomId).emit('balance_update', { userId: result.from.id, newScore: result.from.score });
        io.in(roomId).emit('balance_update', { userId: result.to.id, newScore: result.to.score });

        // Provide UI feedback to the sender
        socket.emit('system_message', {
          type: 'success',
          text: `You tipped ${amount} 🍌 to ${result.to.name}!`
        });
      } catch (error) {
        console.error('Tip User Error:', error.message);
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('kick_user', ({ roomId, targetUserId }) => {
      try {
        const targetPersona = getPersonaById(targetUserId);
        const targetName = targetPersona?.alias || targetUserId;
        kickUser({ roomId, requesterId: persona.id, targetUserId });
        io.in(roomId).emit('user_kicked', { targetUserId });
        io.in(roomId).emit('banned_users_updated', { roomId, users: listBannedUsers(roomId) });
        emitRoomSnapshot(io, roomId);

        // Hook: user_kicked (immediate react)
        enqueueJob(roomId, {
          type: 'hook',
          execute: () => {
            const r = getRoomById(roomId);
            return handleHook(io, roomId, 'user_kicked', { targetName }, r?.monkeyConfig);
          }
        });
        // Hook: user_banned (slightly delayed — ban is permanent consequence of kick)
        enqueueJob(roomId, {
          type: 'hook',
          execute: () => {
            const r = getRoomById(roomId);
            return handleHook(io, roomId, 'user_banned', { targetName }, r?.monkeyConfig);
          }
        });
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('unban_user', ({ roomId, targetUserId }) => {
      try {
        unbanUser({ roomId, requesterId: persona.id, targetUserId });
        io.in(roomId).emit('banned_users_updated', { roomId, users: listBannedUsers(roomId) });
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('update_room_settings', ({ roomId, settings }) => {
      try {
        const prevRoom = getRoomById(roomId);
        const prevLocked = prevRoom?.settings?.lockRoom;
        const prevMuted = prevRoom?.settings?.muteAll;

        const room = updateRoomSettings({ roomId, personaId: persona.id, patch: settings || {} });
        io.in(roomId).emit('room_settings_updated', {
          roomId,
          settings: room.settings,
          monkeyConfig: room.monkeyConfig
        });

        // Re-register crons + restart heartbeat with new config
        reregisterCrons(io, roomId, room.monkeyConfig);
        restartHeartbeat(io, roomId, room.monkeyConfig);

        // Hook: room_locked toggle
        const nowLocked = room.settings.lockRoom;
        if (nowLocked !== prevLocked) {
          enqueueJob(roomId, {
            type: 'hook',
            execute: () => handleHook(io, roomId, nowLocked ? 'room_locked' : 'room_unlocked', {}, room.monkeyConfig)
          });
        }
        // Hook: mute toggle
        const nowMuted = room.settings.muteAll;
        if (nowMuted !== prevMuted) {
          enqueueJob(roomId, {
            type: 'hook',
            execute: () => handleHook(io, roomId, nowMuted ? 'room_muted' : 'room_unmuted', {}, room.monkeyConfig)
          });
        }
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('request_room_admin_data', ({ roomId }) => {
      if (!isRoomAdmin({ roomId, personaId: persona.id })) return;
      socket.emit('flags_updated', { roomId, flags: listRoomFlags(roomId) });
      socket.emit('banned_users_updated', { roomId, users: listBannedUsers(roomId) });
      socket.emit('participants_updated', { roomId, participants: listParticipants(roomId) });
      const roomData = getRoomById(roomId);
      socket.emit('room_settings_updated', {
        roomId,
        settings: roomData?.settings || {},
        monkeyConfig: roomData?.monkeyConfig || {}
      });
    });

    socket.on('delete_room', ({ roomId }) => {
      try {
        deleteRoomByAdmin({ roomId, requesterId: persona.id });
        io.in(roomId).emit('room_deleted', { roomId });
        io.in(roomId).socketsLeave(roomId);
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    // Admin top-up: add bananas to the Monkey Bank from the BANK tab
    socket.on('top_up_monkey_bank', ({ roomId, amount }) => {
      try {
        if (!isRoomAdmin({ roomId, personaId: persona.id })) {
          socket.emit('system_message', { type: 'alert', text: 'Only the room admin can top up the bank.' });
          return;
        }
        const newBalance = topUpMonkeyBank(roomId, amount);
        // Broadcast updated balance to all room members
        io.in(roomId).emit('monkey_bank_update', { roomId, monkeyBankBalance: newBalance });
        socket.emit('system_message', {
          type: 'success',
          text: `Monkey Bank topped up! New balance: ${newBalance} bananas.`
        });
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    // Admin: wipe Monkey's room memory (fresh start for LLM context)
    socket.on('reset_monkey_memory', ({ roomId }) => {
      try {
        if (!isRoomAdmin({ roomId, personaId: persona.id })) {
          socket.emit('system_message', { type: 'alert', text: 'Only the room admin can reset Monkey memory.' });
          return;
        }
        resetMonkeyMemory(roomId);
        socket.emit('system_message', {
          type: 'success',
          text: 'Monkey memory wiped. Fresh slate from next message.'
        });
      } catch (error) {
        socket.emit('system_message', { type: 'alert', text: error.message });
      }
    });

    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      markLeft({ roomId, personaId: persona.id });
      emitRoomSnapshot(io, roomId);
      const room = getRoomById(roomId);
      // Hook: user_left
      enqueueJob(roomId, {
        type: 'hook',
        execute: () => handleHook(io, roomId, 'user_left', { targetName: persona.name }, room?.monkeyConfig)
      });
      // Stop heartbeat if room is now empty
      const remaining = listParticipants(roomId);
      if (!remaining.length) {
        stopHeartbeat(roomId);
        unregisterCrons(roomId);
      }
    });

    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          markLeft({ roomId, personaId: persona.id });
          emitRoomSnapshot(io, roomId);
          const remaining = listParticipants(roomId);
          if (!remaining.length) {
            stopHeartbeat(roomId);
            unregisterCrons(roomId);
          }
        }
      }
    });

    // Admin: reset monkey memory for a room
    socket.on('reset_monkey_memory', ({ roomId }) => {
      if (!isRoomAdmin({ roomId, personaId: persona.id })) return;
      resetMonkeyMemory(roomId);
      socket.emit('system_message', { type: 'success', text: 'Monkey memory cleared.' });
    });
  });
};
