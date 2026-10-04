import React, { useState, useEffect, useRef } from 'react';
import { Phone, ArrowRight, RefreshCw, CheckCircle2, ArrowLeft, User, Mail, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

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

interface PhoneAuthFormProps {
  onSuccess: () => void;
  isLinking?: boolean;
}

export const PhoneAuthForm: React.FC<PhoneAuthFormProps> = ({ onSuccess, isLinking = false }) => {
  const { sendPhoneOtp, verifyPhoneOtp, linkPhone } = useAuth();
  const { addToast } = useToast();

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Format full E.164 phone
  const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

  // Masked phone for display (e.g. +91 ******3210)
  const maskedPhone =
    fullPhoneNumber.length > 6
      ? `${countryCode} ${'*'.repeat(Math.max(0, phoneNumber.length - 4))}${phoneNumber.slice(-4)}`
      : fullPhoneNumber;

  // Password criteria for registration step
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      addToast('warning', 'Invalid Phone Number', 'Please enter a valid phone number (7-15 digits).');
      return;
    }

    setIsSending(true);
    try {
      const expiresIn = await sendPhoneOtp(fullPhoneNumber);
      addToast(
        'success',
        'OTP Sent',
        `Verification code sent to ${fullPhoneNumber}. Valid for ${Math.round(expiresIn / 60)} minutes.`
      );
      setStep('otp');
      setCountdown(60); // 60s cooldown
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to send OTP. Please check your phone number.';
      addToast('error', 'OTP Delivery Failed', msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      const pastedChars = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedChars[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedChars.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    pastedData.split('').forEach((char, idx) => {
      if (idx < 6) newDigits[idx] = char;
    });
    setOtpDigits(newDigits);

    const nextFocus = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextFocus]?.focus();
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      addToast('warning', 'Incomplete Code', 'Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    try {
      if (isLinking) {
        await linkPhone(fullPhoneNumber, otpCode);
        addToast('success', 'Phone Linked', 'Your phone number has been successfully linked.');
        onSuccess();
      } else {
        const res = await verifyPhoneOtp(fullPhoneNumber, otpCode);
        if (res?.needs_registration) {
          addToast('info', 'Phone Verified', 'Please enter your account details to complete registration.');
          setStep('register');
        } else {
          addToast('success', 'Welcome to HabitFlow', 'Phone verification successful!');
          onSuccess();
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid or expired OTP code. Please try again.';
      addToast('error', 'Verification Failed', msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      addToast('warning', 'Missing Details', 'Please fill in all required fields.');
      return;
    }
    if (!isPasswordValid) {
      addToast('warning', 'Password Requirements', 'Please meet all password strength requirements.');
      return;
    }
    if (!passwordsMatch) {
      addToast('warning', 'Password Mismatch', 'Passwords do not match.');
      return;
    }

    setIsRegistering(true);
    try {
      const otpCode = otpDigits.join('');
      await verifyPhoneOtp(fullPhoneNumber, otpCode, fullName.trim(), email.trim().toLowerCase(), password);
      addToast('success', 'Account Created', 'Welcome to HabitFlow!');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please check your details.';
      addToast('error', 'Registration Failed', msg);
    } finally {
      setIsRegistering(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-[#0E2F2B] text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Verify your phone number
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {maskedPhone}
            </span>
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {/* Optional Name prompt for onboarding */}
          {!isLinking && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Your Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                />
              </div>
            </div>
          )}

          {/* 6 Digit OTP Inputs */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  aria-label={`Digit ${idx + 1}`}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-9 h-11 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#07191C] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            id="verify-otp-submit"
            disabled={isVerifying || otpDigits.join('').length !== 6}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isVerifying ? 'Verifying...' : 'Verify OTP & Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Resend & Back Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setOtpDigits(['', '', '', '', '', '']);
            }}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Change Number
          </button>

          {countdown > 0 ? (
            <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
              Resend in {countdown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleSendOtp()}
              disabled={isSending}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} />
              Resend OTP
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Complete Registration for new phone number
  if (step === 'register') {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-[#0E2F2B] text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Complete Your Account
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verified Phone:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {fullPhoneNumber}
            </span>
          </p>
        </div>

        <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                required
                placeholder="Alex Mercer"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                placeholder="alex@example.com"
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

          {/* Password Criteria */}
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
            disabled={isRegistering || !isPasswordValid || !passwordsMatch}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isRegistering ? 'Creating unified account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-center">
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setOtpDigits(['', '', '', '', '', '']);
            }}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Change Number
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Phone input
  return (
    <form onSubmit={handleSendOtp} className="space-y-3.5 animate-fadeIn">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Phone Number
        </label>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all shadow-sm">
          {/* Country Code Dropdown */}
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

          {/* Number input */}
          <div className="relative flex-1">
            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="tel"
              id="phone-number-input"
              required
              placeholder="98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        id="send-otp-submit"
        disabled={isSending || phoneNumber.trim().length < 4}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isSending ? 'Sending OTP code...' : 'Send OTP'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};
