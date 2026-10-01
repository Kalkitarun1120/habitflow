import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, User, Mail, Lock, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      addToast('warning', 'Password Requirements', 'Please fulfill all password strength criteria.');
      return;
    }
    if (password !== confirmPassword) {
      addToast('warning', 'Password Mismatch', 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      await register(name, email, password, browserTimezone);
      addToast('success', 'Account Created', 'Welcome to HabitFlow!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please verify your details.';
      addToast('error', 'Registration Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07171A] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center mx-auto text-white dark:text-slate-950 shadow-sm">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Join Habit<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Start tracking daily routines with schedule-aware momentum
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
              />
            </div>
          </div>

          {/* Password criteria indicator */}
          {password.length > 0 && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 animate-fadeIn">
              <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                {hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 text-slate-400" />} 8+ characters
              </span>
              <span className={`flex items-center gap-1 ${hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                {hasUppercase ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 text-slate-400" />} Uppercase letter
              </span>
              <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                {hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 text-slate-400" />} Number (0-9)
              </span>
              <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                {hasSpecial ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 text-slate-400" />} Special character
              </span>
              {confirmPassword.length > 0 && (
                <span className={`col-span-2 flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500'}`}>
                  {passwordsMatch ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />} Passwords match
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150"
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create Free Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

