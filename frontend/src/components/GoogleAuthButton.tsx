import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => Promise<void>;
  isLoading?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  label?: string;
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  isLoading = false,
  label = 'Continue with Google',
  className = '',
}) => {
  const { addToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '539724896960-pp15sg6uf4um3krkhgg0av3k17guhfdf.apps.googleusercontent.com';

  useEffect(() => {
    // Check if Google script already in document
    const existingScript = document.getElementById('google-jssdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.warn('Google Identity Services script failed to load.');
      };
      document.body.appendChild(script);
    }
  }, []);

  const handleCustomClick = () => {
    if (isLoading || isProcessing) return;

    if (!window.google || !window.google.accounts) {
      addToast(
        'error',
        'Google Sign-In',
        'Google authentication services could not be loaded. Please check your network connection.'
      );
      return;
    }

    try {
      setIsProcessing(true);
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (response.credential) {
            try {
              await onSuccess(response.credential);
            } catch (err: any) {
              const msg =
                err?.response?.data?.detail ||
                'Google sign-in could not be completed. Please try again.';
              addToast('error', 'Google Authentication', msg);
            } finally {
              setIsProcessing(false);
            }
          } else {
            setIsProcessing(false);
            addToast('warning', 'Google Sign-In', 'Google authentication was not completed.');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Trigger One Tap or standard Google prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.warn('Google prompt was not displayed:', notification.getNotDisplayedReason());
        }
        if (notification.isSkippedMoment()) {
          setIsProcessing(false);
        }
      });
    } catch (err) {
      setIsProcessing(false);
      console.error('Google Auth prompt error:', err);
      addToast('error', 'Google Sign-In', 'Unable to open Google sign-in prompt.');
    }
  };

  return (
    <button
      type="button"
      id="google-signin-button"
      onClick={handleCustomClick}
      disabled={isLoading || isProcessing}
      className={`w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#1F4A50] bg-white dark:bg-[#091E23] hover:bg-slate-50 dark:hover:bg-[#0E2F36] text-slate-800 dark:text-slate-100 font-semibold text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{isLoading || isProcessing ? 'Connecting to Google...' : label}</span>
    </button>
  );
};
