export class ApiKeyManager {
    static async getKey() {
        const { openaiApiKey } = await chrome.storage.local.get('openaiApiKey');
        return openaiApiKey;
    }

    static async setKey(apiKey) {
        await chrome.storage.local.set({ openaiApiKey: apiKey });
    }

    static async isKeySet() {
        const key = await this.getKey();
        return Boolean(key);
    }
}