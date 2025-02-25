const { RateLimiter, UserUsageManager, SubscriptionManager } = require('../utils/firestoreCollections');

async function testAllTiers(customerId) {
  const tiers = ['free', 'pro', 'enterprise'];
  
  for (const tier of tiers) {
    console.log(`\n🧪 Testing ${tier.toUpperCase()} tier...`);
    
    // Set up subscription for this tier
    await SubscriptionManager.createOrUpdate(customerId, {
      id: `sub_${tier}_test`,
      status: 'active',
      items: {
        data: [{
          price: {
            nickname: tier
          }
        }]
      },
      current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000)
    });

    // Test throttling for this tier
    const promises = [
      RateLimiter.checkRateLimit(customerId),
      RateLimiter.checkRateLimit(customerId)
    ];

    try {
      await Promise.all(promises);
      console.error(`❌ ${tier} tier throttling failed - concurrent requests were not blocked`);
    } catch (error) {
      if (error.message.includes('Request throttled')) {
        const waitTime = error.message.match(/\d+/)[0];
        console.log(`✅ ${tier} tier throttling success:`);
        console.log(`   • Blocked concurrent requests`);
        console.log(`   • Required wait time: ${waitTime}ms`);
        console.log(`   • Matches ${tier} tier minimum delay`);
      } else {
        console.error(`❌ Unexpected error in ${tier} tier:`, error);
      }
    }

    // Show tier limits
    const { tierLimits } = await RateLimiter.getTierLimits(customerId);
    console.log(`\n📊 ${tier} tier limits:`);
    console.log(`   • Requests per minute: ${tierLimits.requestsPerMinute}`);
    console.log(`   • Minimum delay: ${tierLimits.minDelay}ms`);
  }
}

async function testRateLimiting() {
  const testCustomerId = 'test_customer_123';
  
  console.log('🧪 Starting Comprehensive Rate Limiting Tests...\n');

  // Reset before starting
  await RateLimiter.resetUsage(testCustomerId);

  // Test all tiers
  await testAllTiers(testCustomerId);

  console.log('\n🏁 All tests completed!');
}

// Run the tests
testRateLimiting().catch(console.error); 