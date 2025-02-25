require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const { db } = require('./config/firebase');
const EventTracker = require('./utils/eventTracker');
const app = express();

// Verify environment variables are loaded
if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ Missing required environment variables");
    process.exit(1);
}

// Use raw body parser for Stripe webhooks
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));
// Use JSON parser for all other routes
app.use(bodyParser.json());

// Webhook secret from Stripe
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Webhook handler
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Received event:", event.type);
    
    // Log the full event data for debugging
    console.log("📦 Event data:", JSON.stringify(event.data.object, null, 2));

    // Log the event first
    await EventTracker.logEvent(event);

  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Log session details for debugging
        console.log("🔍 Session details:", {
          customerId: session.customer,
          subscriptionId: session.subscription,
          paymentStatus: session.payment_status,
          mode: session.mode
        });

        // Check if this is a subscription-based checkout
        if (session.mode === 'subscription') {
          await handleSubscriptionCheckout(session);
        } else {
          await handleOneTimePayment(session);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
      }

      case 'charge.succeeded': {
        const charge = event.data.object;
        await handleSuccessfulCharge(charge);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription, event.type);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription, event.type);
        break;
      }

      // Additional events we're seeing
      case 'product.created':
      case 'price.created':
      case 'payment_intent.created':
      case 'charge.updated':
        console.log(`ℹ️ Monitoring event: ${event.type}`);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (err) {
    console.error(`❌ Error processing ${event.type}:`, err.message);
    // Still return 200 to acknowledge receipt
    res.json({ received: true, error: err.message });
  }
});

// Test routes
app.get("/", (req, res) => {
  res.send("✅ Server is running!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).send("Internal Server Error");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhook`);
});

// Helper functions to update your database
async function updateUserSubscription(customerId, data) {
  // Implement your database update logic here
  console.log('Updating user subscription:', { customerId, ...data });
}

async function updateSubscriptionRenewal(customerId, data) {
  // Implement your database update logic here
  console.log('Updating subscription renewal:', { customerId, ...data });
}

async function handleSubscriptionCheckout(session) {
  if (!session.subscription) {
    console.log("ℹ️ Subscription checkout without subscription ID");
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log("✅ Subscription activated:", subscription.id);
    // Add your subscription activation logic here
  } catch (error) {
    console.error("❌ Error retrieving subscription:", error.message);
  }
}

async function handleOneTimePayment(session) {
  console.log("✅ One-time payment processed:", {
    amount: session.amount_total,
    currency: session.currency,
    customer: session.customer
  });
  // Add your one-time payment logic here
}

async function handleSuccessfulPayment(paymentIntent) {
  console.log("✅ Payment processed:", {
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status
  });
  // Add your payment success logic here
}

async function handleSuccessfulCharge(charge) {
  console.log("✅ Charge processed:", {
    amount: charge.amount,
    currency: charge.currency,
    status: charge.status
  });
  // Add your charge success logic here
}

async function handleSubscriptionChange(subscription, eventType) {
  console.log(`✅ Subscription ${eventType}:`, {
    id: subscription.id,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end
  });
  // Add your subscription update/cancellation logic here
} 