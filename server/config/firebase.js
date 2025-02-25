const admin = require('firebase-admin');
const serviceAccount = require('./alt-text-extension-firebase-adminsdk-fbsvc-cab7ab395d.json');

// Verify required configuration
if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    console.error('❌ Invalid service account configuration');
    process.exit(1);
}

let db; // Declare db outside try block

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Note: databaseURL is optional if you're only using Firestore
        // Remove if not using Realtime Database
        // databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });

    db = admin.firestore(); // Assign to the declared variable
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    process.exit(1);
}

module.exports = { admin, db }; 