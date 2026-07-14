import { CheckCircle, Shield, Star } from 'lucide-react';

interface VerificationBadgeProps {
  level?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({ level, size = 'md' }: VerificationBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (!level) return null;

  const getBadgeConfig = () => {
    switch (level) {
      case 'premium':
        return {
          icon: Star,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          label: 'Premium',
        };
      case 'verified':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Verified',
        };
      case 'basic':
        return {
          icon: Shield,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Basic',
        };
      default:
        return null;
    }
  };

  const badge = getBadgeConfig();
  if (!badge) return null;

  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center justify-center rounded-full ${badge.bgColor} ${badge.color} ${sizeClasses[size]}`} title={badge.label}>
      <Icon className={iconSizeClasses[size]} />
    </span>
  );
}