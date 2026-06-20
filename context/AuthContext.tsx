"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ensureUserProfile, toUserProfile, logoutUser } from "@/lib/auth";
import type { UserProfile } from "@/types/user";

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoggingOut: () => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  profile: null,
  loading: true,
  isLoggingOut: () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        loggingOutRef.current = false;
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProfile(toUserProfile(user.uid, snap.data()));
        } else {
          ensureUserProfile(user)
            .then(setProfile)
            .catch((err) => console.error("Failed to load user profile:", err));
        }
      },
      (err) => console.error("User profile subscription error:", err)
    );
    return unsubscribe;
  }, [user]);

  const logout = async () => {
    loggingOutRef.current = true;
    await logoutUser();
    // Reset shortly after, once any redirect triggered by the auth-state
    // change has had a chance to be suppressed by `isLoggingOut()`.
    setTimeout(() => {
      loggingOutRef.current = false;
    }, 1000);
  };

  const isLoggingOut = useCallback(() => loggingOutRef.current, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isLoggingOut, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
