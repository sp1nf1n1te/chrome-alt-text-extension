const RATE_LIMIT = {
    TIME_WINDOW: 60000, // 1 minute
    MAX_REQUESTS: 5
};

export class RateLimiter {
    constructor() {
        this.requests = [];
    }

    async checkLimit() {
        const now = Date.now();
        // Remove requests older than 1 minute
        this.requests = this.requests.filter(time => 
            now - time < RATE_LIMIT.TIME_WINDOW
        );

        if (this.requests.length >= RATE_LIMIT.MAX_REQUESTS) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        this.requests.push(now);
        return true;
    }
}