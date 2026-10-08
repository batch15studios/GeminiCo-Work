import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signOut as fbSignOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../firebase/config.json';
import { AppSettings, ChatSession, Gem, WorkspaceFile, Skill, MCPServer } from '../types';

// Memoized singleton initialization
const app = initializeApp(firebaseConfig.webAppConfig);
export const db = getFirestore(app, firebaseConfig.databaseId);
export const auth = getAuth(app);

export interface UserCloudSyncPayload {
  settings: AppSettings;
  sessions?: ChatSession[];
  gems?: Gem[];
  workspaceFiles?: WorkspaceFile[];
  skills?: Skill[];
  mcpServers?: MCPServer[];
}

const STORAGE_USER_KEY = 'gemini_cowork_user_v1';

export const getStoredUser = (): any | null => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const setStoredUser = (user: any) => {
  if (user && !user.isAnonymous) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0],
      photoURL: user.photoURL,
      isAnonymous: false
    }));
  } else if (!user) {
    localStorage.removeItem(STORAGE_USER_KEY);
  }
};

/**
 * Ensures user is authenticated (anonymous session by default for immediate Firestore access)
 */
export const initAuthSession = (onUserChange: (user: User | any | null) => void) => {
  // If we already have a persisted verified Google/system user, preserve it!
  const saved = getStoredUser();
  if (saved && !saved.isAnonymous) {
    onUserChange(saved);
  }

  return onAuthStateChanged(auth, async (user) => {
    const activeSaved = getStoredUser();
    if (activeSaved && !activeSaved.isAnonymous) {
      // Do not downgrade or overwrite a verified user with an anonymous session!
      return;
    }

    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Anonymous sign-in fallback:', err);
      }
    } else {
      if (!user.isAnonymous) {
        setStoredUser(user);
      }
      onUserChange(user);
    }
  });
};

export const getStoredGoogleToken = (): string | null => {
  return localStorage.getItem('google_workspace_access_token');
};

export const setStoredGoogleToken = (token: string) => {
  localStorage.setItem('google_workspace_access_token', token);
};

export const removeStoredGoogleToken = () => {
  localStorage.removeItem('google_workspace_access_token');
};

import { fetchSystemGoogleAccount } from './googleWorkspaceService';

export interface GoogleLoginResult {
  user: User | any;
  accessToken?: string | null;
  isSystemFallback?: boolean;
}

/**
 * Sign in with Google Account with Google Workspace Scopes
 */
export const loginWithGoogle = async (includeWorkspaceScopes = true): Promise<GoogleLoginResult> => {
  // Step 1: Check if local system Google account (gcloud / ADC) is present and ready
  try {
    const sysAccount = await fetchSystemGoogleAccount();
    if (sysAccount && sysAccount.available && sysAccount.token) {
      console.log('[Auth] Active local system Google account detected:', sysAccount.email);
      setStoredGoogleToken(sysAccount.token);
      const sysUser = {
        uid: 'google-system-' + (sysAccount.email || 'user'),
        email: sysAccount.email || 'batch15studios@gmail.com',
        displayName: sysAccount.name || sysAccount.email?.split('@')[0] || 'Google User',
        photoURL: sysAccount.picture || null,
        isAnonymous: false
      };
      setStoredUser(sysUser);
      return { user: sysUser, accessToken: sysAccount.token, isSystemFallback: true };
    }
  } catch (sysErr) {
    console.warn('[Auth] System Google check notice:', sysErr);
  }

  // Step 2: If no system account available, attempt standard popup
  try {
    const provider = new GoogleAuthProvider();
    if (includeWorkspaceScopes) {
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      provider.addScope('https://www.googleapis.com/auth/documents.readonly');
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (token) {
      setStoredGoogleToken(token);
    }
    setStoredUser(result.user);
    return { user: result.user, accessToken: token, isSystemFallback: false };
  } catch (err: any) {
    console.warn('[Auth] Firebase popup error:', err.code, err.message);
    // On ANY popup failure (closed, blocked, unauthorized-domain), do fallback check
    const sysAccount = await fetchSystemGoogleAccount();
    if (sysAccount && sysAccount.available && sysAccount.token) {
      setStoredGoogleToken(sysAccount.token);
      const sysUser = {
        uid: 'google-system-' + (sysAccount.email || 'user'),
        email: sysAccount.email || 'batch15studios@gmail.com',
        displayName: sysAccount.name || sysAccount.email?.split('@')[0] || 'Google User',
        photoURL: sysAccount.picture || null,
        isAnonymous: false
      };
      setStoredUser(sysUser);
      return { user: sysUser, accessToken: sysAccount.token, isSystemFallback: true };
    }
    throw new Error('Google Sign-In could not complete. You can connect your Google OAuth token directly below.');
  }
};

/**
 * Sign in with email and password
 */
export const loginWithEmail = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

/**
 * Create new account with email and password
 */
export const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return cred;
};

/**
 * Sign out user and re-establish anonymous session
 */
export const logoutUser = async () => {
  await fbSignOut(auth);
  await signInAnonymously(auth);
};

/**
 * Backup and migrate full workspace settings, skills, and MCP servers to Firestore
 */
export const syncUserDataToCloud = async (
  userId: string, 
  payload: UserCloudSyncPayload
): Promise<void> => {
  if (!userId) return;
  const userRef = doc(db, 'users', userId, 'workspace', 'data');
  await setDoc(userRef, {
    settings: payload.settings,
    sessions: payload.sessions || [],
    gems: payload.gems || [],
    workspaceFiles: payload.workspaceFiles || [],
    skills: payload.skills || [],
    mcpServers: payload.mcpServers || [],
    updatedAt: serverTimestamp()
  }, { merge: true });
};

/**
 * Pull and migrate cloud workspace data from Firestore into local state
 */
export const fetchUserDataFromCloud = async (
  userId: string
): Promise<UserCloudSyncPayload | null> => {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId, 'workspace', 'data');
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserCloudSyncPayload;
  }
  return null;
};
