# Rate Limiting Implementation

## Token Bucket Algorithm
Our implementation uses a token bucket algorithm for precise request control:

### How It Works
1. Each user gets a bucket with capacity matching their tier limit
2. Tokens refill at a controlled rate
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

### Error Handling
1. **Throttling Errors**
- Occurs when token bucket is empty
- Includes time until bucket refills

2. **Rate Limit Errors**
- Occurs when requests are too close together
- Includes wait time before next allowed request

javascript:server/docs/rate-limiting/implementation.md
"Rate limit exceeded. Reset in ${resetTime} seconds."

### Best Practices
1. Always initialize buckets with correct tier limits
2. Handle both throttling and rate limit errors
3. Implement exponential backoff for retries
4. Monitor usage patterns for abuse

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
