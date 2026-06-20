import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, type DocumentData } from "firebase/firestore";
import { auth, db } from "./firebase";
import { generateUniqueReferralCode, findUserByReferralCode } from "./referral";
import type { UserProfile } from "@/types/user";

export function toUserProfile(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    name: data.name ?? "",
    email: data.email ?? "",
    referralCode: data.referralCode ?? "",
    referredBy: data.referredBy ?? null,
    walletBalance: data.walletBalance ?? 0,
    walletPoints: data.walletPoints ?? 0,
    role: data.role ?? "buyer",
    createdAt: data.createdAt?.toMillis?.() ?? null,
  };
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return toUserProfile(user.uid, snap.data());
  }

  const referralCode = await generateUniqueReferralCode();
  await setDoc(ref, {
    name: user.displayName ?? "",
    email: user.email ?? "",
    referralCode,
    referredBy: null,
    walletBalance: 0,
    walletPoints: 0,
    role: "buyer" as const,
    createdAt: serverTimestamp(),
  });

  return {
    uid: user.uid,
    name: user.displayName ?? "",
    email: user.email ?? "",
    referralCode,
    referredBy: null,
    walletBalance: 0,
    walletPoints: 0,
    role: "buyer",
    createdAt: Date.now(),
  };
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  referralCodeInput?: string;
}

interface RegisterResult {
  user: User;
  referralCodeApplied: boolean;
}

export async function registerUser({
  name,
  email,
  password,
  referralCodeInput,
}: RegisterParams): Promise<RegisterResult> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName: name });

  const referralCode = await generateUniqueReferralCode();

  let referredBy: string | null = null;
  let referralCodeApplied = false;
  const trimmedInput = referralCodeInput?.trim().toUpperCase();
  if (trimmedInput) {
    const referrer = await findUserByReferralCode(trimmedInput);
    if (referrer) {
      referredBy = trimmedInput;
      referralCodeApplied = true;
    }
  }

  await setDoc(doc(db, "users", user.uid), {
    name,
    email,
    referralCode,
    referredBy,
    walletBalance: 0,
    walletPoints: 0,
    role: "buyer",
    createdAt: serverTimestamp(),
  });

  return { user, referralCodeApplied };
}

export async function loginUser(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
