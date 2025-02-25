export class PaymentHandler {
  static STRIPE_PUBLIC_KEY = 'your_stripe_publishable_key';
  
  static PRODUCTS = {
    BASIC: {
      priceId: 'prod_RpFcmrrgERjcl',
      price: 4.99,
      name: 'Basic Plan',
      features: ['200 ALT text generations monthly', 'SEO-friendly outputs', 'Perfect for small shops']
    },
    PRO: {
      priceId: 'prod_RpFd0xoVKIKl0Z',
      price: 14.99,
      name: 'Pro Plan',
      features: ['750 AI-powered generations monthly', 'Higher token limits', 'Designed for high-volume sellers']
    },
    ENTERPRISE: {
      priceId: 'prod_RpFdu2oVKiheex',
      price: 29.99,
      name: 'Enterprise Plan',
      features: ['2,000 ALT text requests monthly', 'Pay-as-you-go beyond limit', 'Built for large-scale sellers']
    }
  };

  static async initiateCheckout(tier) {
    try {
      // Create checkout session
      const response = await fetch('your_backend_url/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: this.PRODUCTS[tier].priceId,
          successUrl: chrome.runtime.getURL('popup/success.html'),
          cancelUrl: chrome.runtime.getURL('popup/upgrade.html')
        })
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = Stripe(this.STRIPE_PUBLIC_KEY);
      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      throw error;
    }
  }

  static async handleSubscriptionUpdate(sessionId) {
    try {
      const response = await fetch(`your_backend_url/subscription-status?session_id=${sessionId}`);
      const { status, tier } = await response.json();

      if (status === 'active') {
        await UserManager.upgradeTier(tier);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Subscription update failed:', error);
      return false;
    }
  }
} 