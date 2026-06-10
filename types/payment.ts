import type { CartItem } from "@/types/product";

export interface PaymentInitiateRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentInitiateResponse {
  tx_ref: string;
  amount: number;
  signature: string;
}

export interface PaymentVerifyRequest {
  transaction_id: string;
  tx_ref: string;
  expectedAmount: number;
  signature: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      name: string;
      email: string;
      phone_number: string;
    };
  };
}

export interface CompletedOrder {
  txRef: string;
  transactionId: string;
  items: CartItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  paidAt: string;
}
