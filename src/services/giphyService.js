/**
 * Giphy Service
 * Handles fetching trending GIFs and searching.
 */

const API_BASE = "https://api.giphy.com/v1";
/**
 * Note: The Giphy Public Beta Key "dc6zaTOxFJmzC" is often forbidden (403).
 * For a stable experience, please create an app at https://developers.giphy.com/dashboard/ 
 * and replace the key below.
 */
const GIPHY_API_KEY = "dc6zaTOxFJmzC"; 

const handleGiphyError = (error, action) => {
    console.warn(`Giphy ${action} failed. This is likely due to an invalid/forbidden API key.`, error);
    return [];
};

/**
 * Fetches trending GIFs from Giphy.
 */
export const getTrendingGifs = async (limit = 20) => {
    try {
        const response = await fetch(`${API_BASE}/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}`);
        if (response.status === 403) {
            console.error("Giphy API Key Forbidden (403). Please provide a valid key in giphyService.js.");
            return [];
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        return handleGiphyError(error, "trending");
    }
};

/**
 * Searches for GIFs on Giphy.
 */
export const searchGifs = async (query, limit = 20) => {
    try {
        const response = await fetch(`${API_BASE}/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}`);
        if (response.status === 403) {
            console.error("Giphy API Key Forbidden (403). Please provide a valid key in giphyService.js.");
            return [];
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        return handleGiphyError(error, "search");
    }
};
