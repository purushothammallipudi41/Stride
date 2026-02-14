require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('--- Email Configuration Check ---');
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? 'Set' : 'Missing'}`);
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'Set' : 'Missing'}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Missing EMAIL_USER or EMAIL_PASS in .env');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        logger: true, // Log to console
        debug: true   // Include SMTP traffic
    });

    try {
        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Verified');

        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Stride SMTP Test',
            text: 'This is a test email from the Stride backend diagnostics tool.'
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);

    } catch (error) {
        console.error('❌ Email Failed:', error);

        if (error.code === 'EAUTH') {
            console.error('👉 Suggestion: Check your App Password. Make sure 2FA is on and you generated a specific App Password.');
        } else if (error.code === 'ESOCKET') {
            console.error('👉 Suggestion: Network blocking. If on Render, try port 465 or 587 explicitly.');
        }
    }
}

testEmail();
