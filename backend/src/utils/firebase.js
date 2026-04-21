let _admin = null;

const getAdmin = () => {
  if (_admin) return _admin;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) return null;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    _admin = admin;
    return _admin;
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
    return null;
  }
};

/**
 * Send FCM push notification to a single device token.
 * Silently skips if Firebase is not configured or token is missing.
 */
const sendPush = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  const admin = getAdmin();
  if (!admin) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
  } catch (e) {
    // Token expired / invalid — don't crash the request
    console.warn('FCM send failed:', e.message);
  }
};

/**
 * Send FCM to multiple tokens (batch, max 500 per call).
 */
const sendPushMulti = async (fcmTokens, title, body, data = {}) => {
  const tokens = fcmTokens.filter(Boolean);
  if (!tokens.length) return;
  const admin = getAdmin();
  if (!admin) return;
  try {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
  } catch (e) {
    console.warn('FCM multicast failed:', e.message);
  }
};

module.exports = { sendPush, sendPushMulti };
