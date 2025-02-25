# Rate Limiting Usage Examples

## Basic Usage

### 1. Express Middleware

```javascript
const rateLimit = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    await RateLimiter.checkRateLimit(customerId);
    next();
  } catch (error) {
    if (error.message.includes('throttled')) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: error.message,
        retryAfter: parseInt(error.message.match(/\d+/)[0])
      });
    } else {
      next(error);
    }
  }
};

app.use(rateLimit);
```

### 2. Tier Management

```javascript
// Upgrade customer to pro tier
await SubscriptionManager.createOrUpdate(customerId, {
  items: {
    data: [{
      price: { nickname: 'pro' }
    }]
  }
});

// Check new limits
const { tierLimits } = await RateLimiter.getTierLimits(customerId);
console.log(`New limit: ${tierLimits.requestsPerMinute}/minute`);
```

### 3. Client Implementation

```javascript
class APIClient {
  async makeRequest(endpoint) {
    try {
      return await this.callAPI(endpoint);
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        await this.delay(retryAfter);
        return this.makeRequest(endpoint); // Retry
      }
      throw error;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Best Practices

### 1. Error Handling

```javascript
try {
  await RateLimiter.checkRateLimit(customerId);
} catch (error) {
  if (error.message.includes('throttled')) {
    const waitTime = parseInt(error.message.match(/\d+/)[0]);
    // Implement delay and retry
  } else if (error.message.includes('Rate limit')) {
    // Wait for next minute or notify user
  }
}
```

### 2. Monitoring Implementation

```javascript
const monitoredRateLimit = async (customerId) => {
  try {
    const result = await RateLimiter.checkRateLimit(customerId);
    metrics.gauge('rate_limit.remaining', result.remaining);
    return result;
  } catch (error) {
    metrics.increment('rate_limit.exceeded');
    throw error;
  }
};
```

### 3. Batch Processing

```javascript
async function processBatch(items, customerId) {
  for (const item of items) {
    try {
      await RateLimiter.checkRateLimit(customerId);
      await processItem(item);
    } catch (error) {
      if (error.message.includes('throttled')) {
        const waitTime = parseInt(error.message.match(/\d+/)[0]);
        await delay(waitTime);
        // Retry this item
        await processBatch([item], customerId);
      }
    }
  }
}
```

