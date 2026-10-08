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

/**
 * Ensures user is authenticated (anonymous session by default for immediate Firestore access)
 */
export const initAuthSession = (onUserChange: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Anonymous sign-in fallback:', err);
      }
    } else {
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

/**
 * Sign in with Google Account with Google Workspace Scopes
 */
export const loginWithGoogle = async (includeWorkspaceScopes = true) => {
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
  return { user: result.user, accessToken: token };
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
