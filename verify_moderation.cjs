const strideAIEngine = require('./shared/utils/StrideAIEngine');

const testCases = [
    { text: "I love this community", expectedSafe: true },
    { text: "This is a great vibe", expectedSafe: true },
    { text: "I hate you all so much", expectedSafe: false },
    { text: "You are a stupid idiot", expectedSafe: false },
    { text: "Shut up and die", expectedSafe: false },
    { text: "Chill out everyone", expectedSafe: true }
];

console.log("--- StrideAIEngine Moderation Test ---");
testCases.forEach(tc => {
    const safety = strideAIEngine.getSafetyScore(tc.text);
    const pass = safety.isSafe === tc.expectedSafe;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] Text: "${tc.text}" | Safe: ${safety.isSafe} | Score: ${safety.toxicityScore.toFixed(2)}`);
});
