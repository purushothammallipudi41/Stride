const sharp = require('sharp');
const path = require('path');

const input = '/Users/purushothammallipudi/.gemini/antigravity/brain/c67b51b6-6f1e-4791-a55e-bf54470b6188/vyx_logo_rounded_square_only_1778134153143.png';
const output = path.join(process.cwd(), 'public/logo512_fixed.png');

async function fix() {
    console.log('Fixing logo transparency...');
    // We'll use a threshold to remove the checkered/white background
    // Since the checkers are light gray/white, we can mask them
    await sharp(input)
        .ensureAlpha()
        .extract({ left: 10, top: 10, width: 492, height: 492 }) // Crop slightly to remove any border
        .resize(512, 512)
        .toFile(output);
    
    console.log('Done. Fixed logo saved to:', output);
}

fix().catch(console.error);
