import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const getResolvedAvatarUrl = (avatar?: string | null): string | undefined => {
  if (!avatar || typeof avatar !== 'string' || !avatar.trim()) return undefined;
  const trimmed = avatar.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiBase}${cleanPath}`;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.trim()[0]?.toUpperCase() || 'U';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-bold',
    xl: 'w-24 h-24 text-3xl font-bold',
  };

  const resolvedUrl = getResolvedAvatarUrl(avatar);

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm ring-2 ring-emerald-500/20 dark:ring-emerald-400/30 select-none shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {resolvedUrl && !imageError ? (
        <img
          src={resolvedUrl}
          alt={name || 'User Avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

