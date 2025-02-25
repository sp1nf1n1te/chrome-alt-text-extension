const { db } = require('../config/firebase');

/**
 * Simple rate limiting system for right-click extension
 * - Tracks last request time per user
 * - Enforces minimum delays based on subscription tier
 * - Uses Firestore transactions to prevent race conditions
 */
class RateLimiter {
  constructor(db) {
    this.db = db;
    this.usersRef = db.collection('users');
  }

  /**
   * Check if a user can make a request
   * @param {string} userId - The user's ID
   * @returns {Promise<boolean>} - Returns true if request is allowed
   * @throws {Error} - Throws if user needs to wait
   */
  async checkRateLimit(userId) {
    const userRef = this.usersRef.doc(userId);

    // Use transaction to prevent concurrent requests causing race conditions
    return await this.db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const now = Date.now();

      // New users get free tier access
      if (!userDoc.exists) {
        transaction.set(userRef, {
          lastRequest: now,
          plan: 'free'
        });
        return true;
      }

      const userData = userDoc.data();
      const minDelay = this.getMinDelay(userData.plan || 'free');
      const timeSinceLastRequest = now - (userData.lastRequest || 0);

      // Enforce minimum delay between requests
      if (timeSinceLastRequest < minDelay) {
        throw new Error(`Please wait ${minDelay - timeSinceLastRequest}ms`);
      }

      transaction.update(userRef, { lastRequest: now });
      return true;
    });
  }

  /**
   * Get minimum delay based on user's plan
   * @param {string} plan - User's subscription plan
   * @returns {number} - Minimum delay in milliseconds
   */
  getMinDelay(plan) {
    const delays = {
      free: 300,    // Free tier: 1 request per 300ms
      pro: 200,     // Pro tier: 1 request per 200ms
      enterprise: 100 // Enterprise: 1 request per 100ms
    };
    return delays[plan] || delays.free;
  }
}

class SubscriptionManager {
  constructor(db) {
    this.db = db;
    this.usersRef = db.collection('users');
  }

  async createOrUpdate(userId, subscription) {
    const plan = subscription?.items?.data[0]?.price?.nickname || 'free';
    await this.usersRef.doc(userId).set({
      plan: plan
    }, { merge: true });
  }
}

module.exports = { RateLimiter, SubscriptionManager };