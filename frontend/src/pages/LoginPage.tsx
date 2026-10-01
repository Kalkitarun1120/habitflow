import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      addToast('success', 'Welcome Back', 'Successfully signed in to HabitFlow.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid email address or password.';
      addToast('error', 'Authentication Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@example.com');
    setPassword('DemoPassword123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07171A] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center mx-auto text-white dark:text-slate-950 shadow-sm">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in to Habit<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Build sustainable daily habits one day at a time
          </p>
        </div>

        {/* Demo Account Box */}
        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#0E2F2B]/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-semibold text-emerald-900 dark:text-emerald-300 block">Try Demo Account</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">demo@example.com</span>
          </div>
          <button
            type="button"
            onClick={fillDemoAccount}
            className="px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#12383F] hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-300/80 dark:border-emerald-700/60 shadow-sm"
          >
            Auto Fill
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
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
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Register for free
          </Link>
        </div>
      </div>
    </div>
  );
};

