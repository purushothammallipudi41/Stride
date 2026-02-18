const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const inputFile = '/Users/purushothammallipudi/.gemini/antigravity/brain/85cc66d2-3766-410c-97c2-66ce868b0fd3/giphy_video_demo_13_1771401210923.webp';
const outputFile = '/Users/purushothammallipudi/Desktop/giphy_app_demo.mp4';

console.log('Starting conversion...');
console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);

ffmpeg(inputFile)
    .output(outputFile)
    .videoCodec('libx264')
    .outputOptions('-pix_fmt yuv420p')
    .on('end', () => {
        console.log('Conversion finished successfully!');
    })
    .on('error', (err) => {
        console.error('Error:', err);
        process.exit(1);
    })
    .run();
