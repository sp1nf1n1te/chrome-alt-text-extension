# Rate Limiting & Throttling System

## Overview
Our API implements a robust rate limiting system to ensure fair usage and protect against abuse through dual-layer protection:
- Rate limiting (requests per minute)
- Request throttling (minimum delay between requests)

## Key Features
1. **Multi-tier Rate Limiting**
   | Tier       | Requests/Min | Min Delay | Best For                    |
   |------------|-------------|-----------|----------------------------|
   | Free       | 60          | 300ms     | Development, Testing       |
   | Pro        | 500         | 200ms     | Production Apps           |
   | Enterprise | 1000        | 100ms     | High-volume Applications  |

2. **Protection Features**
   - Request throttling
   - Burst protection
   - DDoS mitigation

3. **Developer Tools**
   - Clear error messages
   - Usage monitoring
   - Tier management

## Quick Start

javascript
const { RateLimiter } = require('../../utils/firestoreCollections');
// Check rate limit for a customer
try {
await RateLimiter.checkRateLimit('customer_123');
// Request allowed
} catch (error) {
// Request blocked
}


## Documentation
- [Implementation Details](./implementation.md)
- [Testing Guide](./testing.md)
- [Usage Examples](./examples.md)

# Rate Limiting Implementation

## Token Bucket Algorithm
Our implementation uses a token bucket algorithm for precise request control:

### How It Works
1. Each user gets a bucket with capacity matching their tier limit
2. Tokens refill at a controlled rate (requests per minute / 60,000 tokens per ms)
3. Each request consumes one token
4. Requests without available tokens are rejected

### Code Structure

javascript
class TokenBucket {
constructor() {
this.buckets = new Map();
}
init(customerId, capacity, refillRate) {
// Initialize bucket for customer with:
// - capacity: max tokens (requestsPerMinute)
// - refillRate: tokens per millisecond
// - tokens: current available tokens
// - lastRefill: timestamp of last refill
// - lastRequest: timestamp of last request
}
async checkLimit(customerId, minDelay) {
// 1. Check minimum delay between requests
// 2. Refill tokens based on time passed
// 3. Check if enough tokens available
// 4. Consume token and update timestamps
}
}


### Protection Mechanisms

#### 1. Rate Limiting
- **Token Bucket**: Controls overall request rate
  - Capacity = Requests per minute
  - Refill Rate = Capacity / (60 * 1000) tokens/ms
  - Prevents burst traffic while allowing occasional spikes

#### 2. Throttling
- **Minimum Delay**: Enforces spacing between requests
  - Free: 300ms minimum delay
  - Pro: 200ms minimum delay
  - Enterprise: 100ms minimum delay
  - Prevents automated rapid-fire requests

### Error Handling
1. **Throttling Errors**
javascript
"Request throttled. Please wait ${waitTime}ms before next request."

- Occurs when requests are too close together
- Includes wait time before next allowed request

2. **Rate Limit Errors**
avascript
"Rate limit exceeded. Reset in ${resetTime} seconds."
- Occurs when token bucket is empty
- Includes time until bucket refills

### Best Practices
1. Always initialize buckets with correct tier limits
2. Handle both throttling and rate limit errors
3. Implement exponential backoff for retries
4. Monitor usage patterns for abuse