const axios = require('axios');

async function testIdentity() {
    console.log("Testing POST /api/identity/create");
    try {
        const res = await axios.post('http://localhost:3000/api/identity/create', {
            alias: "TestMonkey",
            avatarSeed: "Luna"
        });
        console.log("✅ Identity Response:", res.data);
    } catch (e) {
        console.error("❌ Identity failed:", e.message);
    }
}
testIdentity();
