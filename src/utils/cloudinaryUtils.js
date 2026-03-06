import config from '../config';
import { encryptionService } from './EncryptionService';

/**
 * Uploads a file to the backend, which forwards it to Cloudinary.
 * @param {File} file - The file to upload.
 * @returns {Promise<string|null>} - The Cloudinary secure URL, or null if failed.
 */
export const uploadToCloudinary = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${config.API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        const data = await response.json();
        return data.url; // The backend returns { url: "..." }
    } catch (error) {
        console.error('Error uploading file to Cloudinary:', error);
        return null;
    }
};

/**
 * Encrypts a file client-side then uploads it to Cloudinary.
 * @returns {Promise<{url: string, key: string, iv: string, type: string}|null>}
 */
export const uploadEncryptedToCloudinary = async (file) => {
    try {
        // 1. Encrypt file client-side
        const { blob, key, iv } = await encryptionService.encryptFile(file);

        // 2. Wrap in a file object for the backend
        const encryptedFile = new File([blob], file.name + '.enc', { type: 'application/octet-stream' });

        // 3. Upload encrypted blob
        const url = await uploadToCloudinary(encryptedFile);
        if (!url) return null;

        return {
            url,
            key,
            iv,
            type: file.type // Keep track of original type for decryption
        };
    } catch (error) {
        console.error('[E2EE] Secure upload failed:', error);
        return null;
    }
};

