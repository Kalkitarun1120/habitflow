import React from 'react';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  size = 'md',
  className = '',
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n[0].toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-bold',
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm ring-2 ring-emerald-500/20 dark:ring-emerald-400/30 select-none ${sizeClasses[size]} ${className}`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
