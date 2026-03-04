const { io } = require("socket.io-client");
const axios = require("axios");

async function testChat() {
    console.log("1. Authenticating...");
    let token = "";
    try {
        const res = await axios.post('http://localhost:3000/api/identity/session', {
            alias: "TestSocketMonkey",
            avatarSeed: "Luna"
        });
        token = res.data.sessionToken;
        console.log("✅ Got Session Token");
    } catch (e) {
        console.error("❌ Auth failed:", e.message);
        return;
    }

    console.log("2. Connecting Socket...");
    const socket = io('http://localhost:3000', {
        auth: { token },
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log("✅ Socket connected, ID:", socket.id);
        console.log("3. Joining Room: null (Triggering default room or failing gracefully)");
        // Just checking connection status, not spamming the DB with fake rooms yet
        setTimeout(() => {
            socket.disconnect();
            console.log("✅ Socket Test Complete.");
        }, 1000);
    });

    socket.on('connect_error', (err) => {
        console.error("❌ Socket Connection Error:", err.message);
    });
}
testChat();
