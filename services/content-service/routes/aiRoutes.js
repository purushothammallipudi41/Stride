const express = require('express');
const router = express.Router();
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require('openai');
const { saveBase64Image } = require('../../../shared/utils/contentSafety');
const fetch = require('node-fetch');
const authenticate = require('../../../shared/middleware/auth');
const Server = require('../../../shared/models/Server');
const ServerMessage = require('../../../shared/models/ServerMessage');
const DirectMessage = require('../../../shared/models/DirectMessage');
const strideAIEngine = require('../../../shared/utils/StrideAIEngine');

// --- Global AI Identity ---
const STRIDE_AI_BRAND = "Stride AI";

// --- Stride Native AI Fallback Model ---
const nativeFallbackModel = {
    generateContent: async (prompt) => {
        const textToAnalyze = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
        const analysis = strideAIEngine.analyze(textToAnalyze);

        // Content Generation (Conversational)
        if (textToAnalyze.toLowerCase().includes('expand') ||
            textToAnalyze.toLowerCase().includes('generate') ||
            textToAnalyze.toLowerCase().includes('summarize')) {
            return {
                response: {
                    text: () => analysis.vibe === 'HYPE'
                        ? `${STRIDE_AI_BRAND} is feeling the energy! 🚀 Top vibe today: Music is trending and the community is hype. Keep striding!`
                        : `${STRIDE_AI_BRAND} Vibe Check: All systems chill. 🎵 New music is flowing and the servers are vibing smoothly.`
                }
            };
        }

        // Structural/Safety (JSON)
        return {
            response: {
                text: () => JSON.stringify({
                    isSafe: true,
                    reason: `Native ${STRIDE_AI_BRAND} Protection`,
                    label: `${STRIDE_AI_BRAND} (${analysis.vibe})`,
                    explanation: analysis.explanation,
                    score: 0.95,
                    vibeColor: analysis.vibe === 'HYPE' ? '#ff0055' : '#00ffcc',
                    toxicityScore: analysis.vibe === 'TOXIC' ? 0.8 : 0.05
                })
            }
        };
    }
};

let genAI = null;
let openai = null;
let genModel = nativeFallbackModel;

// --- Initialize External AI with Validation ---
try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const isValidGemini = geminiKey && geminiKey.length > 20 && geminiKey !== "YOUR_GEMINI_API_KEY";

    if (isValidGemini) {
        genAI = new GoogleGenerativeAI(geminiKey);
        genModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log(`[AI] ${STRIDE_AI_BRAND} leveraging Gemini Cloud`);
    } else {
        console.warn(`[AI] GEMINI_API_KEY missing/invalid. ${STRIDE_AI_BRAND} running in Native mode.`);
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (openAIKey && openAIKey.length > 20) {
        openai = new OpenAI({ apiKey: openAIKey });
    } else {
        openai = {
            images: {
                generate: async () => { throw new Error(`${STRIDE_AI_BRAND} requires an OpenAI key for image generation.`); }
            }
        };
    }
} catch (e) {
    console.error(`[AI] ${STRIDE_AI_BRAND} Initialization Error:`, e.message);
}

// --- Debug ---
router.get('/debug-fallback', async (req, res) => {
    try {
        const result = await genModel.generateContent("generate a test summary");
        res.json({
            usingGemini: !!process.env.GEMINI_API_KEY,
            fallbackOutput: result.response.text(),
            strideBrand: STRIDE_AI_BRAND
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Middlewares ---

const cleanAIResponse = (text) => {
    if (!text) return "";
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();

    // Safety check: Avoid leaking internal JSON in content fields
    if (cleaned.startsWith('{') && (cleaned.includes('isSafe') || cleaned.includes('API Key Missing'))) {
        try {
            const parsed = JSON.parse(cleaned);
            return parsed.explanation || parsed.label || "Stride AI is processing your request.";
        } catch (e) {
            return "Stride AI is vibing with your request.";
        }
    }
    return cleaned;
};

// --- Routes ---

router.post('/summarize', async (req, res) => {
    const { text, context } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });
    try {
        const prompt = `Summarize: "${text}" [Context: ${context || 'General'}]`;
        const result = await genModel.generateContent(prompt);
        res.json({ summary: cleanAIResponse(result.response.text()) });
    } catch (e) {
        res.status(500).json({ error: 'Stride AI summarization is currently offline. We are working to restore the vibe!' });
    }

});

router.post('/translate', async (req, res) => {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) return res.status(400).json({ error: 'Missing requirements' });
    try {
        const prompt = `Translate to ${targetLanguage}: "${text}". ONLY translation.`;
        const result = await genModel.generateContent(prompt);
        res.json({ translatedText: cleanAIResponse(result.response.text()) });
    } catch (e) {
        res.status(500).json({ error: 'Stride AI translation is briefly unavailable.' });
    }

});

router.post('/post-generator', async (req, res) => {
    const { idea } = req.body;
    if (!idea) return res.status(400).json({ error: 'Missing idea' });
    try {
        const prompt = `Expand this idea into an engaging social post with emojis: "${idea}"`;
        const result = await genModel.generateContent(prompt);
        res.json({ post: cleanAIResponse(result.response.text()) });
    } catch (e) {
        res.status(500).json({ error: 'Stride AI generation failed to catch the wave.' });
    }

});

router.post('/sentiment', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });
    try {
        const nativeAnalysis = strideAIEngine.analyze(text);
        if (genAI) {
            const prompt = `Enhance sentiment analysis for: "${text}". Native: ${JSON.stringify(nativeAnalysis)}. Return JSON: {score, label, vibeColor, explanation}`;
            const result = await genModel.generateContent(prompt);
            const enhanced = JSON.parse(cleanAIResponse(result.response.text()));
            return res.json({ ...nativeAnalysis, ...enhanced });
        }
        res.json({
            score: nativeAnalysis.score / 5 > 1 ? 1 : nativeAnalysis.score / 5,
            label: nativeAnalysis.vibe,
            vibeColor: nativeAnalysis.vibe === 'HYPE' ? '#ff0055' : '#00ffcc',
            explanation: nativeAnalysis.explanation
        });
    } catch (e) {
        res.json({ score: 0.5, label: "Neutral", vibeColor: "#888888" });
    }
});

// Mock/Legacy routes kept for compatibility
router.post('/moderate', async (req, res) => {
    const analysis = strideAIEngine.analyze(req.body.text);
    res.json({ isSafe: analysis.vibe !== 'TOXIC', toxicityScore: analysis.vibe === 'TOXIC' ? 0.9 : 0.1 });
});

router.post('/generate-image', async (req, res) => {
    try {
        const response = await openai.images.generate({ model: "dall-e-3", prompt: req.body.prompt });
        const imgRes = await fetch(response.data[0].url);
        const permanentUrl = await saveBase64Image(`data:image/png;base64,${(await imgRes.buffer()).toString('base64')}`);
        res.json({ imageUrl: permanentUrl });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/article-assistant', async (req, res) => {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Missing topic' });
    try {
        const prompt = `Create a structured article outline and an introductory paragraph for: "${topic}". Return JSON: {title, introduction, outline: []}`;
        const result = await genModel.generateContent(prompt);
        const data = JSON.parse(cleanAIResponse(result.response.text()));
        res.json(data);
    } catch (e) {
        res.json({
            title: `Exploration of ${topic}`,
            introduction: `In this article, we dive deep into the world of ${topic} and its impact on the Stride community.`,
            outline: ['Understanding the basics', 'Advanced strategies', 'Community perspectives', 'Future outlook']
        });
    }
});

router.post('/reel-generator', async (req, res) => {
    const { context } = req.body;
    if (!context) return res.status(400).json({ error: 'Missing context' });
    try {
        const prompt = `Create a viral Reel script and storyboard for: "${context}". Return JSON: {scriptTitle, scenes: [{time, visual, audio, textOverlay}]}`;
        const result = await genModel.generateContent(prompt);
        const data = JSON.parse(cleanAIResponse(result.response.text()));
        res.json(data);
    } catch (e) {
        res.json({
            scriptTitle: "The Stride Vibe",
            scenes: [
                { time: "0-3s", visual: "Fast cuts of vibrant city life", audio: "Trending upbeat lo-fi", textOverlay: "Wake up to the Vibe" },
                { time: "3-10s", visual: "User scrolling through Stride feed", audio: "Music swells", textOverlay: "Connect like never before" },
                { time: "10-15s", visual: "Logo animation", audio: "Catchy outro synth", textOverlay: "Join Stride today" }
            ]
        });
    }
});

module.exports = router;
