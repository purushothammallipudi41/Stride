class VoiceService {
    constructor(socket) {
        this.socket = socket;
        this.peerConnections = new Map(); // username -> RTCPeerConnection
        this.localStream = null;
        this.onTrackCallback = null;
        this.onParticipantsUpdate = null;
    }

    async startLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return this.localStream;
        } catch (err) {
            console.error("Failed to get local stream:", err);
            return null;
        }
    }

    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();
    }

    async initiateConnection(targetUsername, myUsername) {
        if (this.peerConnections.has(targetUsername)) return;

        const pc = this.createPeerConnection(targetUsername, myUsername);
        this.peerConnections.set(targetUsername, pc);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        this.socket.emit('voice-offer', {
            to: targetUsername,
            from: myUsername,
            offer: pc.localDescription
        });
    }

    async handleOffer(offer, fromUsername, myUsername) {
        const pc = this.createPeerConnection(fromUsername, myUsername);
        this.peerConnections.set(fromUsername, pc);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.socket.emit('voice-answer', {
            to: fromUsername,
            from: myUsername,
            answer: pc.localDescription
        });
    }

    async handleAnswer(answer, fromUsername) {
        const pc = this.peerConnections.get(fromUsername);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    async handleCandidate(candidate, fromUsername) {
        const pc = this.peerConnections.get(fromUsername);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    createPeerConnection(targetUsername, myUsername) {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    to: targetUsername,
                    from: myUsername,
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            if (this.onTrackCallback) {
                this.onTrackCallback(targetUsername, event.streams[0]);
            }
        };

        return pc;
    }
}

export default VoiceService;
