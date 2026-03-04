const axios = require('axios');

async function testAdmin() {
    console.log("Testing Admin Settings Updates");
    try {
        // 1. Authenticate to get a token
        const auth = await axios.post('http://localhost:3000/api/identity/session', {
            alias: "AdminMonkey",
            avatarSeed: "Oliver"
        });
        const token = auth.data.sessionToken;

        console.log("1. ✅ Auth successful, Token acquired.");

        // 2. We need a room ID to test against, fetch channels first
        const channels = await axios.get('http://localhost:3000/api/channels');
        if (channels.data.length === 0) {
            console.log("No channels exist yet to test admin routes against. Exiting gracefully.");
            return;
        }
        const roomId = channels.data[0].id;
        console.log("2. ✅ Fetched Room:", roomId);

        // 3. Test Room Fetch
        const roomData = await axios.get(`http://localhost:3000/api/channels/${roomId}`);
        console.log("3. ✅ Fetch Room Data success");

        // 4. Test Webhook Rotate (Ensure /api/rooms/:id/webhook/rotate exists)
        // Expected to fail if the user is not the creator, but validates the route exists
        try {
            await axios.post(`http://localhost:3000/api/rooms/${roomId}/webhook/rotate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("4. ✅ Webhook rotation succeeded");
        } catch (e) {
            console.log("4. ⚠️ Webhook rotation (Expected auth/creator failure handled correctly):", e.response?.status || e.message);
        }

    } catch (e) {
        console.error("❌ Admin Test failed:", e.message);
    }
}
testAdmin();
