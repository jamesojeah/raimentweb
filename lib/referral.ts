import { collection, getDocs, query, where, limit, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "./firebase";

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 5;

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function findUserByReferralCode(
  code: string
): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  const q = query(collection(db, "users"), where("referralCode", "==", code), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0];
}

export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = generateReferralCode();
    const existing = await findUserByReferralCode(code);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique referral code. Please try again.");
}
