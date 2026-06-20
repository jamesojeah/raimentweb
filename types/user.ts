export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy: string | null;
  walletBalance: number;
  walletPoints: number;
  role: "buyer" | "vendor" | "admin";
  createdAt: number | null;
}
