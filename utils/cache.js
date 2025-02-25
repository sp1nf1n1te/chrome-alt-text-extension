export class ImageCache {
    static async get(imageUrl) {
        const { cache = {} } = await chrome.storage.local.get('cache');
        const entry = cache[imageUrl];
        
        if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
            return entry.altText;
        }
        return null;
    }

    static async set(imageUrl, altText) {
        const { cache = {} } = await chrome.storage.local.get('cache');
        cache[imageUrl] = {
            altText,
            timestamp: Date.now()
        };
        
        // Clean up old entries
        const now = Date.now();
        Object.keys(cache).forEach(key => {
            if (now - cache[key].timestamp > CACHE_DURATION) {
                delete cache[key];
            }
        });
        
        await chrome.storage.local.set({ cache });
    }
}