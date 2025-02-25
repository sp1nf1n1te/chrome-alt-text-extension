const { db } = require('../config/firebase');
const admin = require('firebase-admin');

const EventTracker = {
  async logEvent(eventData) {
    try {
      const docRef = await db.collection('stripe_events').add({
        eventType: eventData.type,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        customerId: eventData.data.object.customer || null,
        subscriptionId: eventData.data.object.subscription || null,
        data: eventData.data.object,
        status: 'processed',
      });
      console.log('✅ Event logged with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error logging event:', error);
      throw error;
    }
  }
};

module.exports = EventTracker; 