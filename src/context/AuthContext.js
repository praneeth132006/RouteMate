import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up listener');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('onAuthStateChanged:', firebaseUser?.email || 'null');
      
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || '',
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL || '',
        });
      } else {
        setUser(null);
      }
      
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('signIn success:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('signIn error:', error.code);
      let msg = 'Failed to sign in';
      if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password';
      if (error.code === 'auth/user-not-found') msg = 'No account found';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      console.log('signUp success:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('signUp error:', error.code);
      let msg = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') msg = 'Email already in use';
      if (error.code === 'auth/weak-password') msg = 'Password too weak';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('AuthContext.signOut: Starting...');
    try {
      setLoading(true);
      
      await firebaseSignOut(auth);
      
      console.log('AuthContext.signOut: Firebase signOut complete');
      // onAuthStateChanged will set user to null
      
      return { success: true };
    } catch (error) {
      console.error('AuthContext.signOut: Error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, updates);
        setUser(prev => prev ? { ...prev, ...updates } : null);
        return { success: true };
      }
      return { success: false, error: 'No user' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send reset email' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) return { success: false, error: 'No user' };
      
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        return { success: false, error: 'Current password incorrect' };
      }
      return { success: false, error: 'Failed to change password' };
    }
  };

  const value = {
    user,
    loading,
    initializing,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    resetPassword,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
