const { 
  SubscriptionManager, 
  UserUsageManager, 
  PaymentManager 
} = require('../utils/firestoreCollections');

async function runTests() {
  const testCustomerId = 'test_customer_123';
  const testPaymentIntentId = 'test_pi_123';

  console.log('🧪 Starting Firestore Collection Tests...\n');

  // Test SubscriptionManager
  try {
    console.log('Testing SubscriptionManager...');
    await SubscriptionManager.createOrUpdate(testCustomerId, {
      id: 'sub_123',
      status: 'active',
      current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: {
        data: [{
          price: {
            nickname: 'pro',
            metadata: { api_limit: 500 }
          }
        }]
      }
    });
    console.log('✅ SubscriptionManager test passed\n');
  } catch (error) {
    console.error('❌ SubscriptionManager test failed:', error, '\n');
  }

  // Test UserUsageManager
  try {
    console.log('Testing UserUsageManager...');
    await UserUsageManager.createOrUpdate(testCustomerId, 'test@example.com', 500);
    await UserUsageManager.incrementUsage(testCustomerId);
    await UserUsageManager.incrementUsage(testCustomerId);
    await UserUsageManager.resetUsage(testCustomerId);
    console.log('✅ UserUsageManager test passed\n');
  } catch (error) {
    console.error('❌ UserUsageManager test failed:', error, '\n');
  }

  // Test PaymentManager
  try {
    console.log('Testing PaymentManager...');
    await PaymentManager.create(testPaymentIntentId, {
      customer: testCustomerId,
      amount: 999,
      currency: 'usd',
      status: 'processing',
      invoice: 'inv_123'
    });
    await PaymentManager.updateStatus(testPaymentIntentId, 'succeeded');
    console.log('✅ PaymentManager test passed\n');
  } catch (error) {
    console.error('❌ PaymentManager test failed:', error, '\n');
  }

  console.log('🏁 All tests completed!');
}

async function runEdgeCaseTests() {
  const testCustomerId = 'test_customer_123';
  const testPaymentIntentId = 'test_pi_123';

  console.log('🧪 Starting Edge Case Tests...\n');

  // SubscriptionManager Edge Cases
  try {
    console.log('Testing SubscriptionManager Edge Cases...');
    
    // Test missing price nickname
    await SubscriptionManager.createOrUpdate(testCustomerId, {
      id: 'sub_123',
      status: 'active',
      current_period_end: Date.now(),
      items: { data: [{ price: { metadata: { api_limit: 500 } } }] }
    });

    // Test missing API limit
    await SubscriptionManager.createOrUpdate(testCustomerId, {
      id: 'sub_123',
      status: 'active',
      current_period_end: Date.now(),
      items: { data: [{ price: { nickname: 'pro' } }] }
    });

    console.log('✅ SubscriptionManager edge cases passed\n');
  } catch (error) {
    console.error('❌ SubscriptionManager edge cases failed:', error, '\n');
  }

  // UserUsageManager Edge Cases
  try {
    console.log('Testing UserUsageManager Edge Cases...');
    
    // Test API limit exceeded
    await UserUsageManager.createOrUpdate(testCustomerId, 'test@example.com', 2);
    await UserUsageManager.incrementUsage(testCustomerId);
    await UserUsageManager.incrementUsage(testCustomerId);
    try {
      await UserUsageManager.incrementUsage(testCustomerId); // Should fail
      console.error('❌ API limit exceeded test failed - should have thrown error');
    } catch (error) {
      console.log('✅ API limit exceeded test passed');
    }

    // Test non-existent user
    try {
      await UserUsageManager.incrementUsage('non_existent_user');
      console.error('❌ Non-existent user test failed - should have thrown error');
    } catch (error) {
      console.log('✅ Non-existent user test passed');
    }

    console.log('✅ UserUsageManager edge cases passed\n');
  } catch (error) {
    console.error('❌ UserUsageManager edge cases failed:', error, '\n');
  }

  // PaymentManager Edge Cases
  try {
    console.log('Testing PaymentManager Edge Cases...');
    
    // Test invalid status update
    try {
      await PaymentManager.updateStatus('non_existent_payment', 'succeeded');
      console.error('❌ Invalid payment update test failed - should have thrown error');
    } catch (error) {
      console.log('✅ Invalid payment update test passed');
    }

    // Test duplicate payment creation
    await PaymentManager.create(testPaymentIntentId, {
      customer: testCustomerId,
      amount: 999,
      currency: 'usd',
      status: 'processing'
    });
    try {
      await PaymentManager.create(testPaymentIntentId, {
        customer: testCustomerId,
        amount: 999,
        currency: 'usd',
        status: 'processing'
      });
      console.log('✅ Duplicate payment handling passed');
    } catch (error) {
      console.error('❌ Duplicate payment handling failed:', error);
    }

    console.log('✅ PaymentManager edge cases passed\n');
  } catch (error) {
    console.error('❌ PaymentManager edge cases failed:', error, '\n');
  }

  console.log('🏁 All edge case tests completed!');
}

// Run both basic and edge case tests
async function runAllTests() {
  console.log('🚀 Starting All Tests...\n');
  
  console.log('Running Basic Tests...');
  await runTests();
  
  console.log('\nRunning Edge Case Tests...');
  await runEdgeCaseTests();
  
  console.log('\n✨ Test Suite Completed!');
}

runAllTests(); 