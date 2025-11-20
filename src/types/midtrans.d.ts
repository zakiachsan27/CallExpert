// Midtrans Snap TypeScript Definitions

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options?: MidtransSnapOptions
      ) => void;
      hide: () => void;
      show: () => void;
    };
  }
}

export interface MidtransSnapOptions {
  onSuccess?: (result: MidtransTransactionResult) => void;
  onPending?: (result: MidtransTransactionResult) => void;
  onError?: (result: MidtransTransactionResult) => void;
  onClose?: () => void;
}

export interface MidtransTransactionResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  finish_redirect_url?: string;
}

export interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransCustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  billing_address?: MidtransAddress;
  shipping_address?: MidtransAddress;
}

export interface MidtransAddress {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  postal_code: string;
  country_code?: string;
}

export interface MidtransCallbacks {
  finish?: string;
  error?: string;
  pending?: string;
}

export interface CreateSnapTokenRequest {
  transaction_details: MidtransTransactionDetails;
  item_details: MidtransItemDetail[];
  customer_details?: MidtransCustomerDetails;
  credit_card?: {
    secure?: boolean;
    bank?: string;
    installment?: {
      required: boolean;
      terms?: {
        [key: string]: number[];
      };
    };
  };
  callbacks?: MidtransCallbacks;
  expiry?: {
    start_time?: string;
    unit?: 'day' | 'hour' | 'minute';
    duration?: number;
  };
  enabled_payments?: string[];
}

export interface CreateSnapTokenResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransWebhookNotification {
  transaction_time: string;
  transaction_status: 'capture' | 'settlement' | 'pending' | 'deny' | 'cancel' | 'expire' | 'refund';
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time?: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: 'accept' | 'deny' | 'challenge';
  currency?: string;
  approval_code?: string;
  masked_card?: string;
  bank?: string;
  card_type?: string;
  payment_amounts?: any[];
  channel_response_code?: string;
  channel_response_message?: string;
}

export interface PaymentLog {
  id: string;
  booking_id: string;
  order_id: string;
  transaction_status: string;
  payment_type: string | null;
  gross_amount: number;
  raw_notification: MidtransWebhookNotification;
  created_at: string;
}

export {};
