/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize client-side Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Connection verification (as mandated by firebase-integration skill)
async function testConnection() {
  try {
    // Attempting a read to verify connection status
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection verification completed.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Connection verification warning: client appears to be offline. Using local cache.');
    } else {
      console.log('[Firebase] Connection test run (expected results/permissions):', error);
    }
  }
}

// Run connection validation
testConnection();

export { app, db, auth };
