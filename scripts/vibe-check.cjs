const fs = require('fs');
const path = require('path');

console.log("\n🚀 INITIALIZING STRIDE VIBE-CHECK v1.0\n");

const CRITICAL_ASSETS = [
    'src/pages/Login.jsx',
    'src/pages/AdminDashboard.jsx',
    'src/pages/Legal.jsx',
    'src/components/common/SplashScreen.jsx',
    'src/utils/haptics.js',
    'server/index.cjs'
];

let pass = true;

CRITICAL_ASSETS.forEach(asset => {
    const fullPath = path.join(process.cwd(), asset);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ [SYNCED] ${asset}`);
    } else {
        console.error(`❌ [MISSING] ${asset}`);
        pass = false;
    }
});

if (pass) {
    console.log("\n🌕 VIBE-CHECK: SUCCESS. All production systems are GO.");
    console.log("Run 'npm run build:prod' to finalize the pulse.\n");
} else {
    console.error("\n🌑 VIBE-CHECK: FAILED. Please restore missing assets before launch.\n");
    process.exit(1);
}
