import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
  OAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

import { config } from '@/utils/config';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';

class FirebaseService {
  private app: FirebaseApp | null = null;
  private authInstance: Auth | null = null;
  private firestoreInstance: Firestore | null = null;
  private storageInstance: FirebaseStorage | null = null;
  private initialized = false;

  constructor() {
    if (!config.features.disableFirebase) {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.initialized) return;

    try {
      // Initialize Firebase
      this.app = initializeApp(config.firebase);

      // Initialize services
      this.authInstance = getAuth(this.app);
      this.firestoreInstance = getFirestore(this.app);
      this.storageInstance = getStorage(this.app);

      // Connect to emulators in development
      if (config.features.useFirebaseEmulator && config.firebase.emulatorConfig) {
        const emulatorConfig = config.firebase.emulatorConfig;

        try {
          connectAuthEmulator(this.authInstance, emulatorConfig.authURL, {
            disableWarnings: true,
          });

          const [firestoreHost, firestorePort] = emulatorConfig.firestoreHost.split(':');
          connectFirestoreEmulator(
            this.firestoreInstance,
            firestoreHost,
            parseInt(firestorePort, 10)
          );

          const [storageHost, storagePort] = emulatorConfig.storageHost.split(':');
          connectStorageEmulator(
            this.storageInstance,
            storageHost,
            parseInt(storagePort, 10)
          );

          logger.info('Connected to Firebase emulators');
        } catch (error) {
          logger.warn('Failed to connect to Firebase emulators', error);
        }
      }

      this.initialized = true;
      logger.info('Firebase initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase', error);
      throw error;
    }
  }

  get auth(): Auth {
    if (!this.authInstance) {
      throw new Error('Firebase Auth not initialized');
    }
    return this.authInstance;
  }

  get firestore(): Firestore {
    if (!this.firestoreInstance) {
      throw new Error('Firestore not initialized');
    }
    return this.firestoreInstance;
  }

  get storage(): FirebaseStorage {
    if (!this.storageInstance) {
      throw new Error('Firebase Storage not initialized');
    }
    return this.storageInstance;
  }

  // Authentication methods
  async signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await auditService.logLogin(userCredential.user.uid, true);
      return userCredential.user;
    } catch (error: any) {
      await auditService.logLogin(email, false, error.message);
      logger.error('Sign in failed', error);
      throw error;
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      await updateProfile(userCredential.user, { displayName });

      await auditService.log(
        userCredential.user.uid,
        'create',
        'user',
        userCredential.user.uid,
        { email, displayName }
      );

      return userCredential.user;
    } catch (error) {
      logger.error('Sign up failed', error);
      throw error;
    }
  }

  async signInWithApple(): Promise<FirebaseUser> {
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      const userCredential = await signInWithPopup(this.auth, provider);
      await auditService.logLogin(userCredential.user.uid, true);

      return userCredential.user;
    } catch (error: any) {
      await auditService.logLogin('unknown', false, error.message);
      logger.error('Sign in with Apple failed', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      await firebaseSignOut(this.auth);
      if (userId) {
        await auditService.logLogout(userId);
      }
    } catch (error) {
      logger.error('Sign out failed', error);
      throw error;
    }
  }

  onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  // Firestore methods
  async getDocument<T>(collectionName: string, documentId: string): Promise<T | null> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }

      return null;
    } catch (error) {
      logger.error(`Failed to get document ${collectionName}/${documentId}`, error);
      throw error;
    }
  }

  async setDocument<T>(
    collectionName: string,
    documentId: string,
    data: T
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      await setDoc(docRef, data);

      const userId = this.getCurrentUser()?.uid;
      if (userId) {
        await auditService.logDataModification(
          userId,
          'create',
          collectionName as any,
          documentId
        );
      }
    } catch (error) {
      logger.error(`Failed to set document ${collectionName}/${documentId}`, error);
      throw error;
    }
  }

  async updateDocument<T>(
    collectionName: string,
    documentId: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      await updateDoc(docRef, data as any);

      const userId = this.getCurrentUser()?.uid;
      if (userId) {
        await auditService.logDataModification(
          userId,
          'update',
          collectionName as any,
          documentId
        );
      }
    } catch (error) {
      logger.error(`Failed to update document ${collectionName}/${documentId}`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      await deleteDoc(docRef);

      const userId = this.getCurrentUser()?.uid;
      if (userId) {
        await auditService.logDataModification(
          userId,
          'delete',
          collectionName as any,
          documentId
        );
      }
    } catch (error) {
      logger.error(`Failed to delete document ${collectionName}/${documentId}`, error);
      throw error;
    }
  }

  async queryDocuments<T>(
    collectionName: string,
    ...constraints: QueryConstraint[]
  ): Promise<T[]> {
    try {
      const collectionRef = collection(this.firestore, collectionName);
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      logger.error(`Failed to query ${collectionName}`, error);
      throw error;
    }
  }

  // Storage methods
  async uploadFile(
    path: string,
    file: Blob | Uint8Array,
    metadata?: any
  ): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(storageRef);

      const userId = this.getCurrentUser()?.uid;
      if (userId) {
        await auditService.log(userId, 'create', 'user', path, {
          fileSize: file instanceof Blob ? file.size : file.length,
        });
      }

      return downloadURL;
    } catch (error) {
      logger.error(`Failed to upload file to ${path}`, error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);

      const userId = this.getCurrentUser()?.uid;
      if (userId) {
        await auditService.log(userId, 'delete', 'user', path);
      }
    } catch (error) {
      logger.error(`Failed to delete file at ${path}`, error);
      throw error;
    }
  }

  async getFileURL(path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      logger.error(`Failed to get file URL for ${path}`, error);
      throw error;
    }
  }

  // Helper to convert Firestore Timestamp to Date
  timestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }

  // Helper to convert Date to Firestore Timestamp
  dateToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
export { where, Timestamp };

// Convenience export for direct Firestore access
export const db = firebaseService.firestore;
