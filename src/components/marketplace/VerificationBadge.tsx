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
</parameter>
<task_progress>
- [x] Step 1: Analyze existing codebase
- [x] Step 2: Create combined single migration file
- [x] Step 3: Create marketplace server functions
- [x] Step 4: Create marketplace frontend components
- [x] Step 5: Create owner profile page route
- [x] Step 6: Fix migration conflicts with existing V2 schema
- [x] Step 7: Fix migration CHECK constraint syntax
- [x] Step 8: Fix agents/properties schema for backward compatibility
- [x] Step 9: Fix seed.sql VALUES list mismatch by using UNION ALL inserts
- [x] Step 10: Remove stray XML tag from seed.sql
- [x] Step 11: Final verification
- [x] Step 12: Regenerate Supabase types
- [x] Step 13: Create public agent profile route
- [ ] Step 14: Create public owners index route
- [ ] Step 15: Add analytics tracking to property pages
- [ ] Step 16: Update route tree registration
</parameter>
</write_to_file>