/**
 * Rate Limiting Tests
 * Tests realistic usage patterns for right-click extension
 * - Normal usage (human speed)
 * - Protection against rapid clicks
 * - Tier-based speed verification
 */

const { getFirestore } = require('firebase-admin/firestore');
const { RateLimiter, SubscriptionManager } = require('../utils/firestoreCollections');

// Use existing Firebase instance
const db = getFirestore();

async function testRateLimiting(userId) {
  console.log('🧪 Testing Rate Limiting\n');

  const rateLimiter = new RateLimiter(db);
  const subscriptionManager = new SubscriptionManager(db);

  // Test 1: Simulate normal right-click usage pattern
  console.log('1️⃣ Testing normal usage pattern');
  try {
    await rateLimiter.checkRateLimit(userId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Realistic human delay
    await rateLimiter.checkRateLimit(userId);
    console.log('✅ Normal usage works\n');
  } catch (error) {
    console.log('❌ Normal usage failed:', error.message, '\n');
  }

  // Test 2: Verify protection against rapid clicks
  console.log('2️⃣ Testing rapid requests');
  try {
    await rateLimiter.checkRateLimit(userId);
    await rateLimiter.checkRateLimit(userId); // Immediate second request
    console.log('❌ Failed to block rapid requests\n');
  } catch (error) {
    if (error.message.includes('Please wait')) {
      console.log('✅ Rapid requests blocked correctly\n');
    }
  }

  // Test 3: Verify pro tier speeds
  console.log('3️⃣ Testing pro user speed');
  try {
    await subscriptionManager.createOrUpdate(userId, {
      items: { data: [{ price: { nickname: 'pro' } }] }
    });
    await rateLimiter.checkRateLimit(userId);
    await new Promise(resolve => setTimeout(resolve, 250)); // Pro tier delay
    await rateLimiter.checkRateLimit(userId);
    console.log('✅ Pro user speed verified\n');
  } catch (error) {
    console.log('❌ Pro user speed test failed:', error.message, '\n');
  }
}

// Run tests with unique user ID to avoid conflicts
const testUserId = `test_${Date.now()}`;
testRateLimiting(testUserId).catch(console.error); 