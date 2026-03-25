/**
 * Audius Service
 * Handles discovery of host nodes and fetching music data.
 */

const DISCOVERY_URL = "https://api.audius.co";

let selectedHost = null;

/**
 * Selects a healthy discovery node from the Audius network.
 */
export const selectHost = async (forceRefresh = false) => {
    if (selectedHost && !forceRefresh) return selectedHost;
    
    try {
        const response = await fetch(DISCOVERY_URL);
        const data = await response.json();
        
        // Return a random healthy host from the list
        if (data && data.data && data.data.length > 0) {
            // Select a random host from the first 5 healthy ones for performance
            const hosts = data.data.slice(0, 5);
            selectedHost = hosts[Math.floor(Math.random() * hosts.length)];
            console.log(`[Audius] Host selected: ${selectedHost}`);
            return selectedHost;
        }
    } catch (error) {
        console.error("Failed to fetch Audius discovery nodes", error);
    }
    return null;
};

/**
 * Wrapper for fetching with host retry
 */
const fetchWithRetry = async (urlSuffix) => {
    let host = await selectHost();
    if (!host) return null;

    try {
        const res = await fetch(`${host}${urlSuffix}`);
        if (!res.ok) throw new Error("HTTP Error");
        return await res.json();
    } catch (err) {
        console.warn(`[Audius] Request failed on ${host}, retrying... Error: ${err.message}`);
        host = await selectHost(true); // Force refresh host
        if (!host) return null;
        const res = await fetch(`${host}${urlSuffix}`);
        return await res.json();
    }
};

/**
 * Fetches trending tracks from Audius.
 */
export const getTrendingTracks = async () => {
    try {
        const data = await fetchWithRetry(`/v1/tracks/trending?app_name=STRIDE`);
        return data?.data || [];
    } catch (error) {
        console.error("Failed to fetch trending tracks", error);
        return [];
    }
};

/**
 * Searches for tracks on Audius.
 */
export const searchTracks = async (query) => {
    try {
        const data = await fetchWithRetry(`/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=STRIDE`);
        return data?.data || [];
    } catch (error) {
        console.error("Failed to search tracks", error);
        return [];
    }
};

/**
 * Searches for users on Audius.
 */
export const searchUsers = async (query) => {
    try {
        const data = await fetchWithRetry(`/v1/users/search?query=${encodeURIComponent(query)}&app_name=STRIDE`);
        return data?.data || [];
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
