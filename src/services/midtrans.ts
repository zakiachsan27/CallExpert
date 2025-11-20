import { supabase } from './supabase';

export interface CreateSnapTokenParams {
  bookingId: string;
  customerDetails?: {
    first_name: string;
    email: string;
    phone?: string;
  };
}

export interface SnapTokenResponse {
  token: string;
  redirect_url: string;
  order_id: string;
}

/**
 * Create Midtrans Snap token for a booking
 */
export const createSnapToken = async (
  params: CreateSnapTokenParams
): Promise<SnapTokenResponse> => {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error('User not authenticated');

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-snap-token', {
      body: {
        bookingId: params.bookingId,
        customerDetails: params.customerDetails,
      },
    });

    if (error) {
      console.error('Error creating snap token:', error);
      throw error;
    }

    return data as SnapTokenResponse;
  } catch (error) {
    console.error('Failed to create snap token:', error);
    throw error;
  }
};

/**
 * Check payment status for a booking
 */
export const checkPaymentStatus = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('payment_status, status, order_id, paid_at')
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Failed to check payment status:', error);
    throw error;
  }
};

/**
 * Get payment logs for a booking
 */
export const getPaymentLogs = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Failed to get payment logs:', error);
    throw error;
  }
};
