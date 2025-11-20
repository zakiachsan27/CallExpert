import { useEffect, useState } from 'react';

// Declare Midtrans Snap type
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export const useMidtransSnap = () => {
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Snap is already loaded
    if (window.snap) {
      setIsSnapLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load Midtrans Snap script
    const script = document.createElement('script');
    script.src = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    script.setAttribute(
      'data-client-key',
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY || ''
    );

    script.onload = () => {
      setIsSnapLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error('Failed to load Midtrans Snap');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(
        `script[src="${script.src}"]`
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const openSnap = (
    token: string,
    callbacks?: {
      onSuccess?: (result: any) => void;
      onPending?: (result: any) => void;
      onError?: (result: any) => void;
      onClose?: () => void;
    }
  ) => {
    if (!isSnapLoaded || !window.snap) {
      console.error('Midtrans Snap is not loaded yet');
      return;
    }

    window.snap.pay(token, callbacks);
  };

  return {
    isSnapLoaded,
    isLoading,
    openSnap,
  };
};
