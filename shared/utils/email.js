const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('[EMAIL] Nodemailer configured with ' + process.env.EMAIL_USER);
    } catch (e) {
        console.error('[EMAIL] Failed to configure Nodemailer:', e.message);
    }
}

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getEmailTemplate(code) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Stride! 🎵</h2>
            <p>Please use the following code to verify your account:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                ${code}
            </div>
            <p>This code will expire in 15 minutes.</p>
        </div>
    `;
}

async function sendVerificationEmail(email, code) {
    let emailSent = false;
    const emailHtml = getEmailTemplate(code);

    if (resend) {
        try {
            const { data, error } = await resend.emails.send({
                from: 'Stride <noreply@thestrideapp.in>',
                to: [email],
                subject: 'Verify your Stride Account',
                html: emailHtml
            });

            if (!error) {
                console.log(`[EMAIL SENT] via Resend to ${email} (ID: ${data.id})`);
                emailSent = true;
                return true;
            }
        } catch (e) {
            console.error('[RESEND EXCEPTION]', e);
        }
    }

    if (!emailSent && transporter) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verify your Stride Account',
                html: emailHtml
            });
            console.log(`[EMAIL SENT] via Nodemailer to ${email}`);
            emailSent = true;
            return true;
        } catch (e) {
            console.error('[NODEMAILER ERROR]', e);
        }
    }

    if (!emailSent) {
        console.log(`[EMAIL SEND] Logic for ${email}: ${code} - Proceeding with mock/manual verification.`);
    }
    return emailSent;
}

async function sendPasswordResetEmail(email, code) {
    let emailSent = false;
    const subject = 'Stride Password Reset';
    const text = `Your password reset code is: ${code}`;
    const html = `<p>Your password reset code is: <strong>${code}</strong></p>`;

    if (transporter) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject,
                text
            });
            console.log(`[EMAIL] Reset code sent to ${email}`);
            emailSent = true;
        } catch (e) {
            console.error('[NODEMAILER ERROR]', e);
        }
    } else if (resend) {
        try {
            await resend.emails.send({
                from: 'Stride <onboarding@resend.dev>',
                to: email,
                subject,
                html
            });
            console.log(`[EMAIL] Reset code sent to ${email} via Resend`);
            emailSent = true;
        } catch (emailErr) {
            console.error('[EMAIL] Resend failed:', emailErr);
        }
    }

    if (!emailSent) {
        console.log(`[MOCK EMAIL] To: ${email}, Code: ${code}`);
    }
    return emailSent;
}

module.exports = {
    generateVerificationCode,
    sendVerificationEmail,
    sendPasswordResetEmail
};
