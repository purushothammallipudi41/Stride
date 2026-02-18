const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport to mobile size + some padding
    await page.setViewport({ width: 390, height: 844 });

    const recorder = new PuppeteerScreenRecorder(page);
    const outputFile = '/Users/purushothammallipudi/Desktop/giphy_app_demo.mp4';

    console.log('Starting recording...');
    await recorder.start(outputFile);

    // Open the local WebP file
    await page.goto('file:///Users/purushothammallipudi/.gemini/antigravity/brain/85cc66d2-3766-410c-97c2-66ce868b0fd3/giphy_video_demo_13_1771401210923.webp');

    // Wait for the duration of the video (approx 5-7 seconds)
    await new Promise(r => setTimeout(r, 7000));

    await recorder.stop();
    console.log('Recording finished: ' + outputFile);

    await browser.close();
})();
