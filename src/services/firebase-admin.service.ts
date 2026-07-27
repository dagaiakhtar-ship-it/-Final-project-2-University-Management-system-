import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, DecodedIdToken, UserRecord, UpdateRequest } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

class FirebaseAdminService {
  private isInitialized = false;

  /**
   * Safe lazy initialization of Firebase Admin SDK to ensure
   * no startup crash occurs in case of missing or partial config.
   */
  private initialize() {
    if (this.isInitialized) return;

    try {
      if (getApps().length === 0) {
        // Initialize using projectId from the applet configuration.
        // It will automatically use local credentials or Application Default Credentials (ADC) on Cloud Run.
        initializeApp({
          projectId: firebaseConfig.projectId,
        });
        console.log('[FirebaseAdmin] Server-side SDK initialized successfully.');
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('[FirebaseAdmin] Initialization warning (can be normal during local development build):', error);
    }
  }

  /**
   * Verifies a Firebase ID token (JWT) sent by a client app.
   * Useful for Google Sign-In and centralized SSO.
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    this.initialize();
    try {
      return await getAuth().verifyIdToken(idToken);
    } catch (error: any) {
      console.error('[FirebaseAdmin] Failed to verify ID token:', error.message || error);
      throw new Error(`Firebase token verification failed: ${error.message}`);
    }
  }

  /**
   * Creates a new user in Firebase Auth.
   */
  async createUser(email: string, password?: string, displayName?: string): Promise<UserRecord> {
    this.initialize();
    try {
      return await getAuth().createUser({
        email,
        ...(password ? { password } : {}),
        ...(displayName ? { displayName } : {}),
        emailVerified: false,
      });
    } catch (error: any) {
      console.error('[FirebaseAdmin] Failed to create Firebase user:', error.message || error);
      throw new Error(`Firebase user creation failed: ${error.message}`);
    }
  }

  /**
   * Updates an existing user in Firebase Auth.
   */
  async updateUser(uid: string, properties: UpdateRequest): Promise<UserRecord> {
    this.initialize();
    try {
      return await getAuth().updateUser(uid, properties);
    } catch (error: any) {
      console.error('[FirebaseAdmin] Failed to update Firebase user:', error.message || error);
      throw new Error(`Firebase user update failed: ${error.message}`);
    }
  }

  /**
   * Generates a link to reset a password for a given email address.
   */
  async generatePasswordResetLink(email: string): Promise<string> {
    this.initialize();
    try {
      return await getAuth().generatePasswordResetLink(email);
    } catch (error: any) {
      console.error('[FirebaseAdmin] Failed to generate password reset link:', error.message || error);
      throw new Error(`Firebase password reset generation failed: ${error.message}`);
    }
  }

  /**
   * Generates a link to verify a user's email address.
   */
  async generateEmailVerificationLink(email: string): Promise<string> {
    this.initialize();
    try {
      return await getAuth().generateEmailVerificationLink(email);
    } catch (error: any) {
      console.error('[FirebaseAdmin] Failed to generate email verification link:', error.message || error);
      throw new Error(`Firebase email verification generation failed: ${error.message}`);
    }
  }

  /**
   * Deletes a user from Firebase Auth.
   */
  async deleteUser(uid: string): Promise<void> {
    this.initialize();
    try {
      await getAuth().deleteUser(uid);
    } catch (error: any) {
      console.error('[FirebaseAdmin] Failed to delete Firebase user:', error.message || error);
      throw new Error(`Firebase user deletion failed: ${error.message}`);
    }
  }
}

export const firebaseAdminService = new FirebaseAdminService();
export type { DecodedIdToken, UserRecord, UpdateRequest };
