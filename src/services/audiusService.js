/**
 * Audius Service
 * Handles discovery of host nodes and fetching music data.
 */

const DISCOVERY_URL = "https://api.audius.co";

let selectedHost = null;

/**
 * Selects a healthy discovery node from the Audius network.
 */
export const selectHost = async () => {
    if (selectedHost) return selectedHost;
    
    try {
        const response = await fetch(DISCOVERY_URL);
        const data = await response.json();
        // Return a random healthy host from the list
        if (data && data.data && data.data.length > 0) {
            selectedHost = data.data[Math.floor(Math.random() * data.data.length)];
            return selectedHost;
        }
    } catch (error) {
        console.error("Failed to fetch Audius discovery nodes", error);
    }
    return null;
};

/**
 * Fetches trending tracks from Audius.
 */
export const getTrendingTracks = async () => {
    const host = await selectHost();
    if (!host) return [];
    
    try {
        const response = await fetch(`${host}/v1/tracks/trending?app_name=STRIDE`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Failed to fetch trending tracks", error);
        return [];
    }
};

/**
 * Searches for tracks on Audius.
 */
export const searchTracks = async (query) => {
    const host = await selectHost();
    if (!host) return [];
    
    try {
        const response = await fetch(`${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=STRIDE`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Failed to search tracks", error);
        return [];
    }
};

/**
 * Searches for users on Audius.
 */
export const searchUsers = async (query) => {
    const host = await selectHost();
    if (!host) return [];
    
    try {
        const response = await fetch(`${host}/v1/users/search?query=${encodeURIComponent(query)}&app_name=STRIDE`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Failed to search users", error);
        return [];
    }
};

/**
 * Gets the stream URL for a specific track ID.
 */
export const getStreamUrl = async (trackId) => {
    const host = await selectHost();
    if (!host) return null;
    return `${host}/v1/tracks/${trackId}/stream?app_name=STRIDE`;
};
