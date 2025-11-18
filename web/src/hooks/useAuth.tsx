import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User, UserRole } from '@/types';
import firebaseService from '@/services/firebase';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  needsOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userData = await firebaseService.getDocument<User>(
        `users/${firebaseUser.uid}`,
        'profile'
      );

      if (userData) {
        // User exists in Firestore
        return {
          ...userData,
          id: firebaseUser.uid,
          email: firebaseUser.email || userData.email,
          displayName: firebaseUser.displayName || userData.displayName,
          photoURL: firebaseUser.photoURL || userData.photoURL,
        };
      } else {
        // New user - needs onboarding
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          roles: ['patient'], // Default role
          primaryRole: 'patient',
          photoURL: firebaseUser.photoURL,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        };

        return newUser;
      }
    } catch (error) {
      logger.error('Failed to fetch user data', error);
      return null;
    }
  };

  // Check if user needs onboarding
  const checkOnboardingStatus = (user: User): boolean => {
    // User needs onboarding if they haven't consented
    return !user.consentedAt;
  };

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChange(async (fbUser) => {
      setLoading(true);

      if (fbUser) {
        const userData = await fetchUserData(fbUser);

        if (userData) {
          setUser(userData);
          setNeedsOnboarding(checkOnboardingStatus(userData));

          // Update last login
          await firebaseService.updateDocument(`users/${fbUser.uid}`, 'profile', {
            lastLoginAt: new Date(),
          });

          logger.info('User authenticated', { userId: fbUser.uid });
        }
      } else {
        setUser(null);
        setNeedsOnboarding(false);
        logger.info('User signed out');
      }

      setFirebaseUser(fbUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await firebaseService.signInWithEmail(email, password);
      // User state will be updated by onAuthStateChange
    } catch (error) {
      logger.error('Sign in failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<void> => {
    try {
      setLoading(true);
      const fbUser = await firebaseService.signUpWithEmail(email, password, displayName);

      // Create user profile in Firestore
      const newUser: User = {
        id: fbUser.uid,
        email: fbUser.email || email,
        displayName,
        roles: ['patient'],
        primaryRole: 'patient',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await firebaseService.setDocument(`users/${fbUser.uid}`, 'profile', newUser);

      // User state will be updated by onAuthStateChange
    } catch (error) {
      logger.error('Sign up failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async (): Promise<void> => {
    try {
      setLoading(true);
      await firebaseService.signInWithApple();
      // User state will be updated by onAuthStateChange
    } catch (error) {
      logger.error('Sign in with Apple failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await firebaseService.signOut();
      setUser(null);
      setNeedsOnboarding(false);
    } catch (error) {
      logger.error('Sign out failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>): Promise<void> => {
    if (!user) return;

    try {
      const updatedData = {
        ...data,
        updatedAt: new Date(),
      };

      await firebaseService.updateDocument(
        `users/${user.id}`,
        'profile',
        updatedData
      );

      setUser({
        ...user,
        ...updatedData,
      });

      // Check if onboarding is now complete
      if (data.consentedAt) {
        setNeedsOnboarding(false);
      }

      logger.info('User profile updated', { userId: user.id });
    } catch (error) {
      logger.error('Failed to update user profile', error);
      throw error;
    }
  };

  const refetchUser = async (): Promise<void> => {
    if (!firebaseUser) return;

    try {
      const userData = await fetchUserData(firebaseUser);
      if (userData) {
        setUser(userData);
        setNeedsOnboarding(checkOnboardingStatus(userData));
      }
    } catch (error) {
      logger.error('Failed to refetch user data', error);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    needsOnboarding,
    signIn,
    signUp,
    signInWithApple,
    signOut,
    updateUser,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
