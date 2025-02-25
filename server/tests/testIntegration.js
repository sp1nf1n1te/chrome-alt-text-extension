/**
 * Enhanced Integration Tests
 * Focuses on critical path for launch
 */
const { getFirestore } = require('firebase-admin/firestore');
const { RateLimiter, SubscriptionManager } = require('../utils/firestoreCollections');

async function testIntegration(userId) {
  console.log('🔄 Running Critical Path Integration Tests\n');

  const db = getFirestore();
  const rateLimiter = new RateLimiter(db);
  const subscriptionManager = new SubscriptionManager(db);

  // Test 1: Free Tier Usage & Limits
  async function testFreeTier() {
    console.log('1️⃣ Testing Free Tier Behavior');
    try {
      // Test basic rate limiting
      await rateLimiter.checkRateLimit(userId);
      console.log('✓ First request accepted');

      // Test throttling - use Promise.all to ensure requests are truly concurrent
      try {
        await Promise.all([
          rateLimiter.checkRateLimit(userId),
          rateLimiter.checkRateLimit(userId)
        ]);
        console.log('✗ Should have been throttled');
        return false;
      } catch (error) {
        if (error.message.includes('Please wait')) {
          console.log('✓ Properly throttled');
        }
      }

      // Test recovery after delay
      await new Promise(resolve => setTimeout(resolve, 400));
      await rateLimiter.checkRateLimit(userId);
      console.log('✓ Recovered after delay');

      console.log('✅ Free tier tests passed\n');
      return true;
    } catch (error) {
      console.log('❌ Free tier tests failed:', error.message, '\n');
      return false;
    }
  }

  // Test 2: Stripe Integration
  async function testStripeIntegration() {
    console.log('2️⃣ Testing Stripe Integration');
    try {
      // Simulate Stripe webhook for pro upgrade
      await subscriptionManager.createOrUpdate(userId, {
        items: { data: [{ price: { nickname: 'pro' } }] }
      });

      // Verify faster rate limits
      await rateLimiter.checkRateLimit(userId);
      await new Promise(resolve => setTimeout(resolve, 250));
      const allowed = await rateLimiter.checkRateLimit(userId);

      if (allowed) {
        console.log('✅ Stripe integration passed\n');
        return true;
      }
      return false;
    } catch (error) {
      console.log('❌ Stripe integration failed:', error.message, '\n');
      return false;
    }
  }

  // Test 3: End-to-End Flow
  async function testEndToEnd() {
    console.log('3️⃣ Testing End-to-End Flow');
    try {
      // Start as free user
      await rateLimiter.checkRateLimit(userId);
      console.log('✓ Free tier request accepted');

      // Upgrade to pro
      await subscriptionManager.createOrUpdate(userId, {
        items: { data: [{ price: { nickname: 'pro' } }] }
      });
      console.log('✓ Upgraded to pro');

      // Verify pro benefits
      await rateLimiter.checkRateLimit(userId);
      console.log('✓ Pro tier request accepted');

      console.log('✅ End-to-end flow passed\n');
      return true;
    } catch (error) {
      console.log('❌ End-to-end flow failed:', error.message, '\n');
      return false;
    }
  }

  // Run critical tests
  const results = {
    freeTier: await testFreeTier(),
    stripeIntegration: await testStripeIntegration(),
    endToEnd: await testEndToEnd()
  };

  // Summary
  console.log('📊 Critical Integration Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
}

// Run with unique test user
const testUserId = `integration_test_${Date.now()}`;
testIntegration(testUserId).catch(console.error); 