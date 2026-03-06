const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

function checkContentSafety(text, mediaUrl) {
    const sensitiveKeywords = [
        'nude', 'naked', 'sexual', 'porn', 'xxx',
        'violence', 'blood', 'gore', 'kill', 'death',
        'weapon', 'gun', 'drug', 'cocaine', 'heroin'
    ];
    if (!text) return false;

    const lowerText = text.toLowerCase();
    return sensitiveKeywords.some(keyword => lowerText.includes(keyword));
}

async function optimizeImage(buffer) {
    try {
        const sharp = require('sharp');
        return await sharp(buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
    } catch (err) {
        console.error('[SHARP] Optimization failed:', err);
        return buffer;
    }
}

async function saveBase64Image(base64String) {
    if (!base64String.startsWith('data:')) return null;

    try {
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
        let buffer = Buffer.from(base64Data, 'base64');

        // Apply optimization
        buffer = await optimizeImage(buffer);

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'stride_uploads',
                resource_type: 'image'
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            uploadStream.end(buffer);
        });

        console.log(`[CLOUDINARY] Upload success (optimized): ${result.secure_url}`);
        return result.secure_url;
    } catch (err) {
        console.error('[CLOUDINARY] Upload failed:', err);
        return null;
    }
}

const checkPaywallAccess = async (user, contentItem, serverId) => {
    // If not paywalled, everyone has access
    if (!contentItem.isPaywalled) return true;

    // Author always has access
    if (user.email === contentItem.userEmail || user.email === contentItem.authorEmail) return true;

    // Check individual access
    if (user.purchasedContent && user.purchasedContent.includes(contentItem._id.toString())) return true;

    // Check Tier-based access
    if (contentItem.requiredTier) {
        const tierLevels = { 'vibe_pro': 1, 'vibe_prime': 2, 'elite': 3 };
        const userTier = user.subscriptionTier?.toLowerCase() || 'free';
        const requiredTier = contentItem.requiredTier.toLowerCase();

        if (tierLevels[userTier] >= tierLevels[requiredTier]) return true;
    }

    return false;
};

module.exports = {
    checkContentSafety,
    saveBase64Image,
    optimizeImage,
    checkPaywallAccess
};
