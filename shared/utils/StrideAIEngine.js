/**
 * StrideAIEngine.js
 * 
 * A lightweight, rule-based AI engine for Stride.
 * Handles sentiment analysis and "vibe" detection locally.
 */

const VIBE_KEYWORDS = {
    HYPE: ['🔥', 'hype', 'lets go', 'lfg', 'awesome', 'amazing', 'insane', 'victory', 'won', 'champion', 'success', 'excited', 'party', 'celebrate', 'rocket', 'moon', 'legendary', 'boost', 'power'],
    CHILL: ['chill', 'relax', 'vibing', 'peace', 'quiet', 'smooth', 'mellow', 'lofi', 'ambient', 'sleep', 'dream', 'coffee', 'rain', 'zen', 'calm', 'rest'],
    POSITIVE: ['love', 'happy', 'great', 'good', 'nice', 'friendly', 'thanks', 'kind', 'wonderful', 'beautiful', 'joy', 'smile', 'blessed', 'cool', 'perfect'],
    TRENDING: ['viral', 'trending', 'hot', 'new', 'breaking', 'heard', 'everybody', 'shocking', 'surprise', 'omg', 'wow', 'did you see', 'look', 'news'],
    SAD: ['sad', 'bad', 'sorry', 'rough', 'crying', 'failed', 'lost', 'unfortunate', 'rip', 'broken', 'lonely', 'miss', 'pain', 'hurts'],
    TOXIC: ['hate', 'stupid', 'idiot', 'trash', 'garbage', 'worst', 'ugly', 'dumb', 'useless', 'shut up', 'kill', 'die', 'threat', 'scam', 'spam']
};


class StrideAIEngine {
    constructor() {
        this.categories = VIBE_KEYWORDS;
    }

    /**
     * Analyzes text and returns the detected vibe.
     * @param {string} text - The text to analyze.
     * @returns {Object} - { vibe: string, score: number, explanation: string }
     */
    analyze(text) {
        if (!text || typeof text !== 'string') {
            return { vibe: 'NEUTRAL', score: 0, explanation: 'No text provided' };
        }

        const tokens = text.toLowerCase().split(/\W+/);
        const scores = {};

        // Initialize scores
        Object.keys(this.categories).forEach(cat => scores[cat] = 0);

        // Score based on keywords
        tokens.forEach(token => {
            Object.entries(this.categories).forEach(([vibe, keywords]) => {
                if (keywords.includes(token)) {
                    scores[vibe] += 1;
                }
            });
        });

        // Also check for emojis as they are often the best vibe indicators
        Object.entries(this.categories).forEach(([vibe, keywords]) => {
            keywords.forEach(kw => {
                // Check if keyword is an emoji or contains one
                if (text.includes(kw)) {
                    scores[vibe] += 2; // Weight emojis or direct keyword matches higher
                }
            });
        });

        // Find highest score
        let winner = 'NEUTRAL';
        let maxScore = 0;

        Object.entries(scores).forEach(([vibe, score]) => {
            if (score > maxScore) {
                maxScore = score;
                winner = vibe;
            }
        });

        const explanation = maxScore > 0
            ? `Detected ${winner} patterns in the content using Stride Native AI.`
            : "Neutral or unrecognized patterns. Stride AI is monitoring.";

        return {
            vibe: winner,
            score: maxScore,
            explanation,
            isNative: true
        };
    }

    /**
     * Aggregates multiple messages to determine a server-wide "Pulse".
     * @param {Array<string>} messages - Array of message strings.
     */
    getPulse(messages) {
        if (!messages || messages.length === 0) return 'CHILL';

        const counts = {};
        messages.forEach(msg => {
            const { vibe } = this.analyze(msg);
            counts[vibe] = (counts[vibe] || 0) + 1;
        });

        let pulse = 'CHILL';
        let max = 0;
        Object.entries(counts).forEach(([vibe, count]) => {
            if (vibe !== 'NEUTRAL' && count > max) {
                max = count;
                pulse = vibe;
            }
        });

        return pulse;
    }

    /**
     * Checks text for toxicity and returns a safety score.
     * @param {string} text 
     * @returns {Object} - { isSafe: boolean, toxicityScore: number, reason: string|null }
     */
    getSafetyScore(text) {
        const analysis = this.analyze(text);
        const tokens = text.toLowerCase().split(/\W+/);

        let toxicHits = 0;
        this.categories.TOXIC.forEach(word => {
            if (tokens.includes(word)) toxicHits++;
        });

        const toxicityScore = (toxicHits * 0.2) + (analysis.vibe === 'TOXIC' ? 0.4 : 0);
        const cappedScore = Math.min(toxicityScore, 1);

        return {
            isSafe: cappedScore < 0.5,
            toxicityScore: cappedScore,
            reason: cappedScore >= 0.5 ? "Content violates Stride Community Guidelines (AI Detected)" : null,
            isNative: true
        };
    }
}


module.exports = new StrideAIEngine();
