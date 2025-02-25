import { UserManager } from '../utils/userManager.js';
import { PaymentHandler } from '../utils/paymentHandler.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Load Stripe.js dynamically
  const stripeScript = document.createElement('script');
  stripeScript.src = 'https://js.stripe.com/v3/';
  stripeScript.async = true;
  
  // Wait for Stripe to load
  await new Promise((resolve) => {
    stripeScript.onload = resolve;
    document.head.appendChild(stripeScript);
  });

  document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tier = btn.dataset.tier;
      const button = btn;
      
      try {
        button.disabled = true;
        button.textContent = 'Processing...';
        
        await PaymentHandler.initiateCheckout(tier);
      } catch (error) {
        console.error('Upgrade failed:', error);
        button.textContent = 'Error - Try Again';
        button.disabled = false;
      }
    });
  });
}); 