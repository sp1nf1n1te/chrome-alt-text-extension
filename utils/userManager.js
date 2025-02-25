export class UserManager {
  static TIERS = {
    FREE: {
      name: 'Free',
      maxRequests: 5,
      maxTokens: 1500,
      price: 0
    },
    BASIC: {
      name: 'Basic',
      maxRequests: 200,
      maxTokens: 2000,
      price: 4.99
    },
    PRO: {
      name: 'Pro',
      maxRequests: 750,
      maxTokens: 3000,
      price: 14.99
    },
    ENTERPRISE: {
      name: 'Enterprise',
      maxRequests: 2000,
      maxTokens: 4000,
      price: 29.99,
      overageRate: 0.10
    }
  };

  static async getCurrentUser() {
    const data = await chrome.storage.local.get(['user']);
    if (!data.user) {
      // Initialize new free user
      const newUser = {
        tier: 'FREE',
        requestsUsed: 0,
        requestsRemaining: UserManager.TIERS.FREE.maxRequests,
        tokensUsed: 0,
        monthlyTokens: 0,
        subscriptionStart: Date.now(),
        subscriptionEnd: this.getNextMonthDate(),
        usageHistory: [] // Array to store monthly usage data
      };
      await chrome.storage.local.set({ user: newUser });
      return newUser;
    }
    return data.user;
  }

  static async incrementRequests() {
    const user = await this.getCurrentUser();
    const tier = this.TIERS[user.tier];
    
    // Check if subscription period has reset
    if (Date.now() > user.subscriptionEnd) {
      user.requestsUsed = 0;
      user.requestsRemaining = tier.maxRequests;
      user.subscriptionStart = Date.now();
      user.subscriptionEnd = this.getNextMonthDate();
    }

    // Check if user has hit their limit
    if (user.requestsUsed >= tier.maxRequests) {
      if (user.tier === 'ENTERPRISE') {
        // Handle enterprise overage billing
        return {
          success: true,
          overageCharge: tier.overageRate
        };
      }
      return {
        success: false,
        reason: 'limit_reached',
        tier: user.tier
      };
    }

    // Increment request count
    user.requestsUsed++;
    user.requestsRemaining--;
    await chrome.storage.local.set({ user });

    return {
      success: true,
      remaining: user.requestsRemaining
    };
  }

  static getNextMonthDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.getTime();
  }

  static async upgradeTier(newTier) {
    if (!this.TIERS[newTier]) {
      throw new Error('Invalid tier');
    }

    const user = await this.getCurrentUser();
    user.tier = newTier;
    user.requestsUsed = 0;
    user.requestsRemaining = this.TIERS[newTier].maxRequests;
    user.subscriptionStart = Date.now();
    user.subscriptionEnd = this.getNextMonthDate();

    await chrome.storage.local.set({ user });
    return user;
  }

  static async trackTokenUsage(tokenCount) {
    const user = await this.getCurrentUser();
    
    // Update token counts
    user.tokensUsed += tokenCount;
    user.monthlyTokens += tokenCount;

    // Add to usage history
    const today = new Date().toISOString().split('T')[0];
    const existingDayIndex = user.usageHistory.findIndex(h => h.date === today);
    
    if (existingDayIndex >= 0) {
      user.usageHistory[existingDayIndex].tokens += tokenCount;
      user.usageHistory[existingDayIndex].requests += 1;
    } else {
      user.usageHistory.push({
        date: today,
        tokens: tokenCount,
        requests: 1
      });
    }

    // Keep only last 30 days of history
    user.usageHistory = user.usageHistory
      .slice(-30)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    await chrome.storage.local.set({ user });
    return user;
  }

  static async getUsageAnalytics() {
    const user = await this.getCurrentUser();
    const tier = this.TIERS[user.tier];

    return {
      currentPeriod: {
        requests: user.requestsUsed,
        requestsLimit: tier.maxRequests,
        tokens: user.monthlyTokens,
        tokensLimit: tier.maxTokens * tier.maxRequests
      },
      lifetime: {
        totalRequests: user.requestsUsed,
        totalTokens: user.tokensUsed
      },
      history: user.usageHistory,
      subscription: {
        tier: user.tier,
        start: user.subscriptionStart,
        end: user.subscriptionEnd
      }
    };
  }

  static async getCurrentPlan() {
    const data = await chrome.storage.local.get('userPlan');
    return data.userPlan || 'FREE';
  }

  static async getUsageStats() {
    const data = await chrome.storage.local.get(['usageStats', 'userPlan']);
    const plan = data.userPlan || 'FREE';
    
    const limits = {
      FREE: { requests: 5, tokens: 1500 },
      BASIC: { requests: 200, tokens: 2000 },
      PRO: { requests: 750, tokens: 3000 },
      ENTERPRISE: { requests: 2000, tokens: 4000 }
    };

    return {
      requestsUsed: data.usageStats?.requests || 0,
      requestsLimit: limits[plan].requests,
      tokensUsed: data.usageStats?.tokens || 0,
      tokensLimit: limits[plan].tokens
    };
  }

  static async getUsageHistory() {
    const data = await chrome.storage.local.get('usageHistory');
    const history = data.usageHistory || [];
    
    // If no history exists, create initial entry
    if (history.length === 0) {
      const currentStats = await this.getUsageStats();
      const today = new Date().toISOString().split('T')[0];
      
      history.push({
        date: today,
        requests: currentStats.requestsUsed,
        tokens: currentStats.tokensUsed
      });

      // Save the initial history
      await chrome.storage.local.set({ usageHistory: history });
    }

    return history;
  }

  static async updateUsage(requestCount = 1, tokenCount = 0) {
    const data = await chrome.storage.local.get(['usageStats', 'usageHistory']);
    const today = new Date().toISOString().split('T')[0];
    
    // Update current stats
    const currentStats = data.usageStats || { requests: 0, tokens: 0 };
    const newStats = {
      requests: currentStats.requests + requestCount,
      tokens: currentStats.tokens + tokenCount
    };

    // Update history
    let history = data.usageHistory || [];
    const todayEntry = history.find(entry => entry.date === today);
    
    if (todayEntry) {
      todayEntry.requests = newStats.requests;
      todayEntry.tokens = newStats.tokens;
    } else {
      history.push({
        date: today,
        requests: newStats.requests,
        tokens: newStats.tokens
      });
    }

    // Keep only last 30 days
    history = history.slice(-30);

    // Save updates
    await chrome.storage.local.set({
      usageStats: newStats,
      usageHistory: history
    });

    return newStats;
  }

  static async resetUsage() {
    const user = await this.getCurrentUser();
    user.requestsUsed = 0;
    user.tokensUsed = 0;
    user.monthlyTokens = 0;
    
    await chrome.storage.local.set({ 
        user,
        usageStats: { requests: 0, tokens: 0 }
    });
    
    return user;
  }
} 