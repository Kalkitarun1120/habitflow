import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, User as UserIcon, Mail, Lock, ArrowRight, Eye, EyeOff, Check, X, ShieldCheck, KeyRound, ArrowLeft, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { authService } from '../services/api';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
];

export const RegisterPage: React.FC = () => {
  const { loginWithGoogle, setUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'details' | 'verify'>('details');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Full E.164 phone
  const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phoneNumber || !password) {
      addToast('warning', 'Missing Fields', 'Please fill in all registration fields.');
      return;
    }
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      addToast('warning', 'Invalid Phone', 'Please enter a valid phone number (7-15 digits).');
      return;
    }
    if (!isPasswordValid) {
      addToast('warning', 'Password Requirements', 'Please fulfill all password strength criteria.');
      return;
    }
    if (!passwordsMatch) {
      addToast('warning', 'Password Mismatch', 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const res = await authService.requestSignupOtp(name.trim(), email.trim().toLowerCase(), fullPhoneNumber, password, browserTimezone);
      addToast('success', 'Verification Code Sent', res.message || `SMS OTP sent to ${fullPhoneNumber}`);
      setStep('verify');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Could not send verification code. Please check your details.';
      addToast('error', 'Registration Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      addToast('warning', 'Invalid Code', 'Please enter the verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const data = await authService.verifySignupOtp(name.trim(), email.trim().toLowerCase(), fullPhoneNumber, password, otp.trim(), browserTimezone);
      
      // Save session
      localStorage.setItem('habitflow_token', data.access_token);
      localStorage.setItem('habitflow_user', JSON.stringify(data.user));
      setUser(data.user);

      addToast('success', 'Account Activated', 'Welcome to HabitFlow!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid verification code. Please check and try again.';
      addToast('error', 'Verification Failed', msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const res = await authService.requestSignupOtp(name.trim(), email.trim().toLowerCase(), fullPhoneNumber, password, browserTimezone);
      addToast('success', 'Code Resent', res.message || `A new verification code was sent to ${fullPhoneNumber}.`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Could not resend code. Please wait before retrying.';
      addToast('error', 'Resend Failed', msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      await loginWithGoogle(credential);
      addToast('success', 'Welcome to HabitFlow', 'Account successfully created with Google.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Google sign-up failed. Please try again.';
      addToast('error', 'Google Sign Up Failed', msg);
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
            {step === 'details'
              ? 'Create your unified account to start tracking habits and building streaks'
              : `Enter the 6-digit verification code sent to ${fullPhoneNumber}`}
          </p>
        </div>

        {step === 'details' ? (
          <div className="space-y-4">
            {/* Google OAuth */}
            <div>
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                label="Sign up with Google"
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-[#0C1E22] px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Or register below
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRequestOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Tarun"
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
                    placeholder="tarun@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Phone Number with Country Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all shadow-sm">
                  <select
                    value={countryCode}
                    aria-label="Country Code"
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-2.5 py-2 bg-transparent text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-white dark:bg-[#0C1E22] text-slate-900 dark:text-white">
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium focus:outline-none"
                    />
                  </div>
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

              {/* Password Criteria Checklist */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 space-y-1 text-[11px]">
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    {hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                    <span>At least 8 chars</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    {hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                    <span>Has a number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    {hasUppercase ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    {hasLowercase ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                    <span>Lowercase letter</span>
                  </div>
                </div>
                {confirmPassword && (
                  <div className={`flex items-center gap-1.5 pt-0.5 text-[10px] ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500'}`}>
                    {passwordsMatch ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                    <span>Passwords match</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isPasswordValid || !passwordsMatch || !phoneNumber.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Sending verification code...' : 'Continue to Phone Verification'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: OTP Verification Modal */
          <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fadeIn">
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-1">
              <KeyRound className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                Verify Your Phone Number
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                SMS sent to {fullPhoneNumber}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] font-mono text-lg font-bold py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.length < 4}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifying ? 'Verifying & creating account...' : 'Verify & Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change details
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer disabled:opacity-50"
              >
                {isResending ? 'Resending code...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          <div>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Unified account with Email, Phone & Google</span>
          </div>
        </div>
      </div>
    </div>
  );
};

