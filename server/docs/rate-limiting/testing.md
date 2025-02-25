# Rate Limiting Testing Guide

## Test Categories

### 1. Basic Tests

javascript
// Test single request
await RateLimiter.checkRateLimit('customer_123');
// Test sequential requests
const request1 = await RateLimiter.checkRateLimit('customer_123');
const request2 = await RateLimiter.checkRateLimit('customer_123'); // Should throttle

### 2. Stress Tests
- **Burst Testing**: Multiple concurrent requests
- **Sequential Testing**: Rapid sequential requests
- **Distributed Testing**: Requests with varying delays
- **Cross-Tier Testing**: Behavior during tier changes

### 3. Common Test Scenarios

#### Throttling Tests

javascript:server/docs/rate-limiting/testing.md
// Should be throttled (too fast)
try {
await Promise.all([
RateLimiter.checkRateLimit('customer_123'),
RateLimiter.checkRateLimit('customer_123')
]);
} catch (error) {
// Expected: "Request throttled. Please wait Xms"
}

#### Rate Limit Tests

javascript
// Should hit rate limit after X requests
for (let i = 0; i < tierLimit + 1; i++) {
  try {
    await RateLimiter.checkRateLimit('customer_123');
  } catch (error) {
    // Expected: "Rate limit exceeded"
  }
}

## Test Results
- ✅ Throttling working when requests < minDelay
- ✅ Rate limits enforced per tier
- ✅ Proper error messages
- ✅ Accurate timing checks

