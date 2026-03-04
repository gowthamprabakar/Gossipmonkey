const axios = require('axios');

async function testChannels() {
    console.log("Testing GET /api/channels");
    try {
        const res = await axios.get('http://localhost:3000/api/channels');
        console.log("✅ Channels Response Count:", res.data.length);
        if (res.data.length > 0) {
            console.log("Example Channel:", res.data[0].name, "| Type:", res.data[0].type);
        }
    } catch (e) {
        console.error("❌ Channels failed:", e.message);
    }
}
testChannels();
