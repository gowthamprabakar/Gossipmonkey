import { upsertPersona, getPersonaStats } from '../services/identityService.js';
import { createSessionToken, extractTokenFromHeader, revokeSessionToken } from '../services/authService.js';

export const createSession = (req, res) => {
  try {
    const persona = upsertPersona(req.body || {});
    const token = createSessionToken(persona.id);

    return res.status(201).json({
      success: true,
      data: { persona, token }
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMe = (req, res) => {
  const stats = getPersonaStats(req.persona.id);
  return res.json({
    success: true,
    data: { persona: req.persona, stats }
  });
};

export const panicReset = (req, res) => {
  const token = extractTokenFromHeader(req.headers.authorization || '');
  const result = revokeSessionToken(token);
  return res.json({
    success: true,
    data: {
      revoked: result.revoked,
      nextRoute: '/onboarding',
      message: 'Session revoked. Clear local app state and restart onboarding.'
    }
  });
};
