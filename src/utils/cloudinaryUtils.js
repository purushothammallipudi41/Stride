import config from '../config';

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
