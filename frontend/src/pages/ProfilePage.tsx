import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Globe,
  Calendar,
  ShieldCheck,
  Flame,
  Award,
  Download,
  KeyRound,
  LogOut,
  Trash2,
  X,
  Phone,
  Camera,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Edit2,
  Save,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { statisticsService, authService } from '../services/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import type { StatisticsResponse } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, logout, linkGoogle, unlinkProvider, updateProfile, uploadAvatar, removeAvatar, changePassword } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Edit Basic Profile (Name, Timezone)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editTimezone, setEditTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Avatar Upload & Remove
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isRemoveAvatarDialogOpen, setIsRemoveAvatarDialogOpen] = useState(false);

  // Email Change Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // Phone Change Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Delete Account State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Common Timezones
  const timezones = [
    'UTC',
    'Asia/Kolkata',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    }
    statisticsService.getStats('all').then(setStats).catch(() => {});
  }, [user]);

  if (!user) return null;

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // 1. Save Basic Profile (Name & Timezone)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        timezone: editTimezone,
      });
      addToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
      setIsEditingProfile(false);
    } catch (err: any) {
      addToast('error', 'Update Failed', err?.response?.data?.detail || 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Avatar Upload & Remove
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('warning', 'Invalid File', 'Please select an image file (PNG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('warning', 'File Too Large', 'Please select an image smaller than 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      addToast('success', 'Avatar Updated', 'Your new profile picture has been uploaded.');
    } catch (err: any) {
      addToast('error', 'Upload Failed', err?.response?.data?.detail || 'Could not upload avatar image.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    try {
      await removeAvatar();
      addToast('success', 'Profile Picture Removed', 'Your avatar has been reset to default initials.');
      setIsRemoveAvatarDialogOpen(false);
    } catch (err: any) {
      addToast('error', 'Remove Failed', err?.response?.data?.detail || 'Could not remove profile picture.');
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  // 3. Email Change Flow
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsSubmittingEmail(true);
    try {
      const res = await authService.requestEmailChange(newEmail.trim());
      addToast('success', 'Verification Code Sent', res.message || `Code sent to ${newEmail}`);
      setEmailStep('verify');
    } catch (err: any) {
      addToast('error', 'Request Failed', err?.response?.data?.detail || 'Could not send verification code.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.length < 6) return;

    setIsSubmittingEmail(true);
    try {
      const updatedUser = await authService.verifyEmailChange(newEmail.trim(), emailOtp.trim());
      await updateProfile({ name: updatedUser.name }); // Sync context
      addToast('success', 'Email Updated', `Your verified email is now ${updatedUser.email}`);
      setIsEmailModalOpen(false);
      setEmailStep('input');
      setNewEmail('');
      setEmailOtp('');
    } catch (err: any) {
      addToast('error', 'Verification Failed', err?.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // 4. Phone Change Flow
  const handleRequestPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    setIsSubmittingPhone(true);
    try {
      const res = await authService.requestPhoneChange(newPhone.trim());
      addToast('success', 'OTP Sent', res.message || `Code sent to ${newPhone}`);
      setPhoneStep('verify');
    } catch (err: any) {
      addToast('error', 'Request Failed', err?.response?.data?.detail || 'Could not send SMS code.');
    } finally {
      setIsSubmittingPhone(false);
    }
  };

  const handleVerifyPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtp || phoneOtp.length < 6) return;

    setIsSubmittingPhone(true);
    try {
      const updatedUser = await authService.verifyPhoneChange(newPhone.trim(), phoneOtp.trim());
      await updateProfile({ name: updatedUser.name });
      addToast('success', 'Phone Updated', `Your verified phone is now ${updatedUser.phone_number}`);
      setIsPhoneModalOpen(false);
      setPhoneStep('input');
      setNewPhone('');
      setPhoneOtp('');
    } catch (err: any) {
      addToast('error', 'Verification Failed', err?.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setIsSubmittingPhone(false);
    }
  };

  // 5. Change Password Flow
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast('warning', 'Weak Password', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('warning', 'Mismatch', 'New passwords do not match.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      addToast('success', 'Password Updated', 'Your account password has been updated.');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast('error', 'Password Error', err?.response?.data?.detail || 'Current password incorrect.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // 6. Link / Unlink Google & Phone
  const handleLinkGoogleSuccess = async (credential: string) => {
    try {
      await linkGoogle(credential);
      addToast('success', 'Google Account Linked', 'Your Google account has been successfully linked.');
    } catch (err: any) {
      addToast('error', 'Google Linking Failed', err?.response?.data?.detail || 'Could not link Google account.');
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    try {
      await unlinkProvider(provider);
      addToast('info', 'Provider Unlinked', `${provider.toUpperCase()} has been disconnected from your account.`);
    } catch (err: any) {
      addToast('error', 'Unlink Failed', err?.response?.data?.detail || 'Cannot unlink authentication method.');
    }
  };

  // 7. Export Data
  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const data = await authService.exportData(format);
      let blob: Blob;
      let filename = `habitflow_export_${new Date().toISOString().split('T')[0]}.${format}`;

      if (format === 'csv') {
        blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('success', 'Export Complete', `Your data was downloaded as ${format.toUpperCase()}.`);
    } catch {
      addToast('error', 'Export Failed', 'Could not export user data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount();
      addToast('info', 'Account Deleted', 'Your account and data have been removed.');
      logout();
    } catch {
      addToast('error', 'Delete Failed', 'Could not delete account.');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-4xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      {/* 1. Profile Header Card */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-[#16383B] shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar with upload & remove buttons */}
        <div className="flex flex-col items-center sm:items-start gap-3">
          <div className="relative group">
            <UserAvatar
              name={user.name}
              avatar={user.avatar}
              size="xl"
              className="w-24 h-24 text-3xl shadow-md ring-4 ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar || isRemovingAvatar}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
              title="Upload new profile picture"
            >
              {isUploadingAvatar ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar || isRemovingAvatar}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isUploadingAvatar ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3 h-3" />
                  <span>{user.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                </>
              )}
            </button>

            {user.avatar && (
              <button
                type="button"
                onClick={() => setIsRemoveAvatarDialogOpen(true)}
                disabled={isUploadingAvatar || isRemovingAvatar}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Remove profile picture"
              >
                {isRemovingAvatar ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* User Info & Edit Toggle */}
        <div className="text-center sm:text-left space-y-1.5 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {user.email || user.phone_number || 'HabitFlow Explorer'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#12383F] text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-[#16444D] hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {isEditingProfile ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Verified Account
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#07191C] text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-800">
              <Globe className="w-3 h-3" /> {user.timezone || 'UTC'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#07191C] text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-800">
              <Calendar className="w-3 h-3" /> Member since {joinedDate}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Editable Profile Form (Inline Edit Mode) */}
      {isEditingProfile && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white dark:bg-[#0C1E22] rounded-2xl p-5 sm:p-6 border border-emerald-200/90 dark:border-emerald-800/50 space-y-4 shadow-sm animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Edit Account Information
            </h2>
            <span className="text-[11px] text-slate-400">Save changes to persist</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <select
                  value={editTimezone}
                  onChange={(e) => setEditTimezone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Account Credentials & Verification (Email & Phone Change) */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Contact Information & Ownership Verification
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Changes to email or phone number require one-time OTP verification before being saved
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Email Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Primary Email
                </span>
                {user.is_email_verified ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono font-medium truncate">
                {user.email || 'No email attached'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewEmail(user.email || '');
                setEmailStep('input');
                setIsEmailModalOpen(true);
              }}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#12383F] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Change Email</span>
            </button>
          </div>

          {/* Phone Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Phone Number
                </span>
                {user.phone_number && user.is_phone_verified ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Not Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono font-medium truncate">
                {user.phone_number || 'No phone attached'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewPhone(user.phone_number || '');
                setPhoneStep('input');
                setIsPhoneModalOpen(true);
              }}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#12383F] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{user.phone_number ? 'Change Phone' : 'Add Phone Number'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Connected Accounts & Multi-Auth Providers */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Connected Accounts & Login Methods
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Access your single HabitFlow account using multiple secure authentication options
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Google */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google
                </span>
                {user.google_id || user.connected_providers?.includes('google') ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    ✓ Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Not Linked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.google_id ? 'Google Account Connected' : 'Connect Google for 1-click login'}
              </p>
            </div>

            <div>
              {user.google_id || user.connected_providers?.includes('google') ? (
                <button
                  type="button"
                  onClick={() => handleUnlinkProvider('google')}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Unlink Google
                </button>
              ) : (
                <GoogleAuthButton
                  onSuccess={handleLinkGoogleSuccess}
                  label="Link Google"
                  className="!py-1.5 !text-xs"
                />
              )}
            </div>
          </div>

          {/* Phone OTP */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Phone Login
                </span>
                {user.phone_number && user.is_phone_verified ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    ✓ Active
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Not Linked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {user.phone_number || 'Link phone for SMS OTP login'}
              </p>
            </div>

            <div>
              {user.phone_number && user.is_phone_verified ? (
                <button
                  type="button"
                  onClick={() => handleUnlinkProvider('phone')}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Unlink Phone
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNewPhone('');
                    setPhoneStep('input');
                    setIsPhoneModalOpen(true);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Link Phone
                </button>
              )}
            </div>
          </div>

          {/* Email / Password */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  Password
                </span>
                {user.has_password !== false ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    ✓ Active
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    None Set
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.has_password !== false ? 'Protected by secure hash' : 'Set password for email login'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#12383F] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3 h-3" />
              <span>{user.has_password !== false ? 'Change Password' : 'Set Password'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Account Performance Statistics */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Overall Account Statistics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Habits
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.active_habits || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Completions
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.total_completions || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> Current Streak
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.current_streak || 0} Days
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-500" /> Longest Streak
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.longest_streak || 0} Days
            </span>
          </div>
        </div>
      </div>

      {/* 6. Account Actions & Data Portability */}
      <div className="bg-white dark:bg-[#0C1E22] rounded-xl p-5 border border-slate-200/90 dark:border-[#16383B] space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Account Actions & Data Portability
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export JSON */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Export JSON
              </span>
              <span className="text-[10px] text-slate-500">
                Habits & history data
              </span>
            </div>
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-[#12383F] text-slate-800 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>

          {/* Export CSV */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Export CSV
              </span>
              <span className="text-[10px] text-slate-500">
                Spreadsheet log entries
              </span>
            </div>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-[#12383F] text-slate-800 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>

          {/* Sign Out */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#07191C] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Session
              </span>
              <span className="text-[10px] text-slate-500">
                Sign out on this device
              </span>
            </div>
            <button
              onClick={logout}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-[#12383F] text-slate-800 dark:text-slate-200 hover:bg-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              Delete Account
            </span>
            <span className="text-[11px] text-slate-500">
              Permanently erase your account and all associated habit tracking history
            </span>
          </div>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </button>
        </div>
      </div>

      {/* --- MODAL 1: Email Change with Verification OTP --- */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0C1E22] border border-slate-200 dark:border-[#16383B] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Change Primary Email
              </h3>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {emailStep === 'input' ? (
              <form onSubmit={handleRequestEmailChange} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your new email address. We will send a 6-digit verification code to confirm ownership.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="newemail@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEmail || !newEmail}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmittingEmail ? 'Sending code...' : 'Send Verification Code'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailChange} className="space-y-4 animate-fadeIn">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                    Verification Code Sent
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    {newEmail}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.4em] font-mono text-base font-bold py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailStep('input')}
                    className="text-xs text-slate-500 hover:underline cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEmail || emailOtp.length < 6}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmittingEmail ? 'Verifying...' : 'Verify & Save Email'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: Phone Change with Verification OTP --- */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0C1E22] border border-slate-200 dark:border-[#16383B] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {user.phone_number ? 'Change Phone Number' : 'Add Phone Number'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {phoneStep === 'input' ? (
              <form onSubmit={handleRequestPhoneChange} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your international phone number in E.164 format (e.g. +919876543210).
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPhone || !newPhone}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmittingPhone ? 'Sending OTP...' : 'Send SMS OTP'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneChange} className="space-y-4 animate-fadeIn">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                    SMS Verification Code Sent
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    {newPhone}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">
                    Enter 6-Digit SMS OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.4em] font-mono text-base font-bold py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPhoneStep('input')}
                    className="text-xs text-slate-500 hover:underline cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPhone || phoneOtp.length < 6}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmittingPhone ? 'Verifying...' : 'Verify & Save Phone'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 3: Change Password Modal --- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0C1E22] border border-slate-200 dark:border-[#16383B] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {user.has_password !== false ? 'Change Account Password' : 'Set Account Password'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              {user.has_password !== false && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (Min 8 chars)
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#07191C] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword || !newPassword || newPassword !== confirmPassword}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmittingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Avatar Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRemoveAvatarDialogOpen}
        onCancel={() => setIsRemoveAvatarDialogOpen(false)}
        onConfirm={handleRemoveAvatar}
        title="Remove Profile Picture"
        message="Are you sure you want to remove your profile picture? Your profile and navbar will display your initials instead."
        confirmLabel="Remove Picture"
        cancelLabel="Cancel"
        isDanger={true}
      />

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete HabitFlow Account"
        message="Are you completely sure you want to delete your account? All habits, streak logs, completions, and custom categories will be permanently removed. This action cannot be undone."
        confirmLabel="Yes, Delete My Account"
        cancelLabel="Keep Account"
        isDanger={true}
      />
    </div>
  );
};
