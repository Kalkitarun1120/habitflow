import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail, ArrowRight, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { authService } from '../services/api';
import { useToast } from '../components/Toast';

export const ForgotPasswordPage: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(email);
      setSubmitted(true);
      addToast('success', 'Recovery Code Sent', res.message);
    } catch {
      // Still show generic message to prevent account enumeration
      setSubmitted(true);
      addToast('success', 'Recovery Code Sent', 'If an account exists for this email, password recovery instructions have been sent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07171A] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0C1E22] border border-slate-200/90 dark:border-[#16383B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Forgot Password?
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your email address and we'll send you a single-use recovery code to reset your password.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Email Address
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Sending recovery code...' : 'Send Recovery Code'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                Instructions Dispatched
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-900 dark:text-white">{email}</span>, a 6-digit verification code valid for 15 minutes has been sent.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Enter Recovery Code & Reset Password</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <Link
            to="/login"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Secure password recovery with single-use verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
