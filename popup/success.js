import { PaymentHandler } from '../utils/paymentHandler.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (sessionId) {
    const success = await PaymentHandler.handleSubscriptionUpdate(sessionId);
    if (!success) {
      document.querySelector('.success-container').innerHTML = `
        <h2>Oops!</h2>
        <p>There was an issue activating your subscription.</p>
        <p>Please contact support if this persists.</p>
      `;
    }
  }
}); 