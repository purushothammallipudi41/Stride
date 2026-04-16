const Message = require('../models/Message.cjs');

class SocialAIService {
    /**
     * Generates a rhythmic summary (Vibe Pulse) of recent community activity.
     * Simulation of high-fidelity LLM summarization.
     */
    static async generateCommunityPulse(communityId) {
        try {
            // Fetch last 50 messages to establish the social context
            const messages = await Message.find({ roomId: communityId })
                .sort({ createdAt: -1 })
                .limit(50);

            if (!messages || messages.length === 0) {
                return {
                    summary: "The rhythm is quiet right now. No recent major pulses detected.",
                    highlights: ["Be the first to start the vibe!"],
                    vibeLevel: "Chill"
                };
            }

            // Extract keywords for rhythmic simulation
            const textContent = messages.map(m => m.content).join(' ');
            const highlights = [];
            
            if (textContent.includes('drop') || textContent.includes('song') || textContent.includes('music')) {
                highlights.push("Discussing upcoming musical drops 🎶");
            }
            if (textContent.includes('live') || textContent.includes('stream')) {
                highlights.push("Anticipation for a community broadcast 🎥");
            }
            if (textContent.includes('collab') || textContent.includes('work')) {
                highlights.push("Potential creative collaboration in the works 🤝");
            }
            if (textContent.includes('vibe') || textContent.includes('pulse')) {
                highlights.push("Platform evolution and vibe-checking 🧬");
            }

            // High-fidelity rhythmic summary generation (Simulated AI)
            const topicCount = highlights.length;
            let summary = "";
            let vibeLevel = "Steady";

            if (topicCount >= 3) {
                summary = "The community is reaching a fever pitch with multiple high-fidelity discussions about new drops and potential collaborations.";
                vibeLevel = "Electric";
            } else if (topicCount >= 1) {
                summary = "Social rhythm is focused on core creative updates. Engagement is consistent around recent drops.";
                vibeLevel = "Focused";
            } else {
                summary = "The pulse is steady. General social interaction is maintaining a collaborative atmosphere.";
                vibeLevel = "Harmonious";
            }

            return {
                summary,
                highlights: highlights.length > 0 ? highlights : ["General social synergy is active."],
                vibeLevel,
                analyzedCount: messages.length,
                timestamp: new Date()
            };
        } catch (err) {
            console.error('SocialAIService Error:', err);
            return {
                summary: "Intelligence pulse interrupted. Stride is recalibrating.",
                highlights: ["Sync Error"],
                vibeLevel: "Offline"
            };
        }
    }
}

module.exports = SocialAIService;
