import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * Helper utilities for calling Supabase Edge Functions
 */

export interface EdgeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  accessToken?: string;
  headers?: Record<string, string>;
}

/**
 * Call a Supabase Edge Function with proper authentication
 *
 * @param functionName - Name of the edge function
 * @param endpoint - Optional endpoint path (e.g., '/user/signup')
 * @param options - Request options
 * @returns Response data
 *
 * @example
 * // Public endpoint (uses anon key)
 * const data = await callEdgeFunction('make-server-92eeba71', '/user/signup', {
 *   method: 'POST',
 *   body: { email, password, name }
 * });
 *
 * @example
 * // Authenticated endpoint (uses access token)
 * const data = await callEdgeFunction('make-server-92eeba71', '/expert/profile', {
 *   accessToken: userToken,
 *   method: 'GET'
 * });
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  endpoint: string = '',
  options: EdgeFunctionOptions = {}
): Promise<T> {
  const { method = 'GET', body, accessToken, headers: customHeaders = {} } = options;

  // Use access token if provided, otherwise use public anon key
  const authToken = accessToken || publicAnonKey;

  const url = `https://${projectId}.supabase.co/functions/v1/${functionName}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    'apikey': publicAnonKey,
    ...customHeaders,
  };

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Edge Function Error [${functionName}${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Type-safe wrapper for common edge function calls
 */
export const edgeFunctions = {
  /**
   * User signup
   */
  signup: async (email: string, password: string, name: string) => {
    return callEdgeFunction('make-server-92eeba71', '/user/signup', {
      method: 'POST',
      body: { email, password, name },
    });
  },

  /**
   * Get expert profile
   */
  getExpertProfile: async (accessToken: string) => {
    return callEdgeFunction('make-server-92eeba71', '/expert/profile', {
      method: 'GET',
      accessToken,
    });
  },

  /**
   * Update expert profile
   */
  updateExpertProfile: async (accessToken: string, profileData: any) => {
    return callEdgeFunction('make-server-92eeba71', '/expert/profile', {
      method: 'PUT',
      accessToken,
      body: profileData,
    });
  },

  /**
   * Get expert transactions
   */
  getExpertTransactions: async (accessToken: string) => {
    return callEdgeFunction('make-server-92eeba71', '/expert/transactions', {
      method: 'GET',
      accessToken,
    });
  },

  /**
   * Submit withdraw request
   */
  submitWithdrawRequest: async (
    accessToken: string,
    withdrawData: {
      amount: number;
      bankName: string;
      accountNumber: string;
      accountName: string;
      notes?: string;
    }
  ) => {
    return callEdgeFunction('make-server-92eeba71', '/expert/withdraw-request', {
      method: 'POST',
      accessToken,
      body: withdrawData,
    });
  },
};

/**
 * Example usage in components:
 *
 * // Simple signup
 * import { edgeFunctions } from '../services/edgeFunctions';
 * const data = await edgeFunctions.signup(email, password, name);
 *
 * // Get expert profile
 * const profile = await edgeFunctions.getExpertProfile(accessToken);
 *
 * // Custom edge function call
 * import { callEdgeFunction } from '../services/edgeFunctions';
 * const result = await callEdgeFunction('my-function', '/my/endpoint', {
 *   method: 'POST',
 *   body: { data: 'value' },
 *   accessToken: token
 * });
 */
