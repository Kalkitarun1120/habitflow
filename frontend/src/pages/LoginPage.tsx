import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { PhoneAuthForm } from '../components/PhoneAuthForm';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [authMethod, setAuthMethod] = useState<'standard' | 'phone'>('standard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      addToast('success', 'Welcome Back', 'Successfully signed in to HabitFlow.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Incorrect email or password. Please try again.';
      addToast('error', 'Authentication Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      await loginWithGoogle(credential);
      addToast('success', 'Welcome to HabitFlow', 'Signed in with Google successfully.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Google sign-in failed. Please try again.';
      addToast('error', 'Google Authentication Failed', msg);
    }
  };

  const fillDemoAccount = () => {
    setAuthMethod('standard');
    setEmail('demo@example.com');
    setPassword('DemoPassword123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07171A] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center mx-auto text-white dark:text-slate-950 shadow-sm">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome to Habit<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to track your habits, streaks, and personal analytics
          </p>
        </div>

        {/* Demo Box Quick Access */}
        <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-[#0E2F2B]/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-emerald-900 dark:text-emerald-300 block text-[11px]">
              Fast Demo Login
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
              demo@example.com
            </span>
          </div>
          <button
            type="button"
            onClick={fillDemoAccount}
            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#12383F] hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-300/80 dark:border-emerald-700/60 shadow-sm cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        {authMethod === 'standard' ? (
          <div className="space-y-5">
            {/* Google OAuth Button */}
            <div>
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                label="Continue with Google"
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-[#0C1E22] px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Or continue with email
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>

            {/* Email + Password Form (NO OTP ON NORMAL LOGIN) */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Logging in...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Switch to Phone Login */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Prefer phone OTP? Continue with Phone →</span>
              </button>
            </div>
          </div>
        ) : (
          /* Phone + OTP Login View */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Phone Number Login
              </span>
              <button
                type="button"
                onClick={() => setAuthMethod('standard')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                ← Back to Email / Google
              </button>
            </div>

            <PhoneAuthForm
              onSuccess={() => {
                navigate('/dashboard');
              }}
            />
          </div>
        )}

        {/* Footer info & Links */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          <div>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Create account
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Secure authentication & privacy protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
