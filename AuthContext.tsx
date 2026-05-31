import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db, storage } from "@/lib/firebase";

export interface AppUser {
  uid: string;
  email: string;
  username: string;
  userId: string;
  photoURL?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  ghostMode: boolean;
  setGhostMode: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: { username?: string; photoURL?: string }) => Promise<void>;
  uploadProfilePhoto: (uri: string) => Promise<string>;
}

function generateUserId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [ghostMode, setGhostModeState] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const setGhostMode = useCallback(async (v: boolean) => {
    setGhostModeState(v);
    await AsyncStorage.setItem("ghostMode", v ? "1" : "0");
  }, []);

  const loadProfile = useCallback(async (fbUser: FirebaseUser): Promise<AppUser | null> => {
    try {
      const snap = await getDoc(doc(db, "users", fbUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        return {
          uid: fbUser.uid,
          email: fbUser.email ?? "",
          username: data.username,
          userId: data.userId,
          photoURL: data.photoURL ?? undefined,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("ghostMode").then((val) => {
      if (val === "1") setGhostModeState(true);
    });

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await loadProfile(fbUser);
        setUser(profile);
        if (profile) {
          await updateDoc(doc(db, "users", fbUser.uid), { status: "online" }).catch(() => {});
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    unsubRef.current = unsub;
    return () => unsub();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await loadProfile(cred.user);
    if (!profile) throw new Error("Profile not found. Please register.");
    setUser(profile);
    await updateDoc(doc(db, "users", cred.user.uid), { status: "online" }).catch(() => {});
  }, [loadProfile]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userId = generateUserId();
    const profile: AppUser = { uid: cred.user.uid, email, username, userId };
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      username,
      userId,
      status: "online",
      createdAt: Date.now(),
    });
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      await updateDoc(doc(db, "users", user.uid), { status: "offline" }).catch(() => {});
    }
    await signOut(auth);
    await AsyncStorage.clear();
    setUser(null);
    setGhostModeState(false);
  }, [user]);

  const updateProfile = useCallback(async (updates: { username?: string; photoURL?: string }) => {
    if (!user) return;
    const updateData: Record<string, string> = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.photoURL !== undefined) updateData.photoURL = updates.photoURL;
    await updateDoc(doc(db, "users", user.uid), updateData);
    setUser((prev) => prev ? { ...prev, ...updates } : null);
  }, [user]);

  const uploadProfilePhoto = useCallback(async (uri: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    const response = await fetch(uri);
    const blob = await response.blob();
    const ref = storageRef(storage, `users/${user.uid}/profile.jpg`);
    const snapshot = await uploadBytes(ref, blob);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, ghostMode, setGhostMode, signIn, register, logout, updateProfile, uploadProfilePhoto }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
