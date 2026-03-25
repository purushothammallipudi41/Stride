const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "community_test_load";
const USER_COUNT = 10;
const TEST_DURATION_MS = 10000;

console.log(`🚀 Starting Load Test: ${USER_COUNT} users syncing in ${ROOM_ID}...`);

const sockets = [];

for (let i = 0; i < USER_COUNT; i++) {
    const socket = io(SERVER_URL);
    const username = `TestUser_${i}`;

    socket.on("connect", () => {
        // console.log(`[${username}] Connected`);
        socket.emit("register_user", { username, avatar: '', avatarFrame: 'none' });
        socket.emit("join_room", ROOM_ID);
    });

    socket.on("playback_synced", (data) => {
        // console.log(`[${username}] Received sync from ${data.sender}`);
    });

    socket.on("room_members_updated", (data) => {
        // console.log(`[${username}] Room members: ${data.members.length}`);
    });

    sockets.push(socket);
}

// Simulate periodic sync events from one "Master" user
const masterSocket = sockets[0];
let progress = 0;

const interval = setInterval(() => {
    progress += 1;
    masterSocket.emit("sync_playback", {
        roomId: ROOM_ID,
        track: { id: 'test_track', title: 'Load Test' },
        progress: progress,
        isPlaying: true,
        sender: masterSocket.id
    });
    // console.log(`[Master] Emitted sync at ${progress}s`);
}, 1000);

setTimeout(() => {
    clearInterval(interval);
    sockets.forEach(s => s.disconnect());
    console.log("✅ Load Test Finished Successfully.");
    process.exit(0);
}, TEST_DURATION_MS);
