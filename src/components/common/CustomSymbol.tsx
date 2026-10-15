import React from 'react';
import {
  CarFront,
  Fuel,
  Wrench,
  Sparkles,
  UtensilsCrossed,
  ShoppingBag,
  Receipt,
  Heart,
  Fingerprint,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Gem,
  Flame,
  Zap,
  ShieldCheck,
  Scale,
  Target,
  Compass,
} from 'lucide-react';

interface CategorySymbolProps {
  category: string;
  subCategory?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

/**
 * Creative, out-of-the-box symbolic emblems with soft neo-gradients
 */
export const CategorySymbol: React.FC<CategorySymbolProps> = ({
  category,
  subCategory,
  size = 'md',
  className = '',
  color,
}) => {
  const catLower = (category || '').toLowerCase();
  const subLower = (subCategory || '').toLowerCase();

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-xl',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  // Determine creative badge icon and aesthetic gradient
  let IconComponent = Tag;
  let bgGradient = 'from-slate-400/20 to-slate-500/30 text-slate-700 dark:text-slate-300';
  let glyphEmblem = '✦';

  if (catLower.includes('car')) {
    if (subLower.includes('fuel')) {
      IconComponent = Fuel;
      bgGradient = 'from-blue-500/20 via-cyan-500/20 to-indigo-500/30 text-blue-600 dark:text-blue-400';
      glyphEmblem = '⚡';
    } else if (subLower.includes('maintenance')) {
      IconComponent = Wrench;
      bgGradient = 'from-amber-500/20 via-orange-500/20 to-rose-500/30 text-amber-600 dark:text-amber-400';
      glyphEmblem = '⚙';
    } else if (subLower.includes('cleaning')) {
      IconComponent = Sparkles;
      bgGradient = 'from-teal-400/20 via-sky-400/20 to-indigo-400/30 text-teal-600 dark:text-teal-400';
      glyphEmblem = '✨';
    } else {
      IconComponent = CarFront;
      bgGradient = 'from-blue-500/20 via-indigo-500/20 to-purple-500/30 text-blue-600 dark:text-blue-400';
      glyphEmblem = '🚘';
    }
  } else if (catLower.includes('food')) {
    IconComponent = UtensilsCrossed;
    bgGradient = 'from-amber-500/20 via-yellow-500/20 to-orange-500/30 text-amber-600 dark:text-amber-400';
    glyphEmblem = '🍽';
  } else if (catLower.includes('fuel')) {
    IconComponent = Fuel;
    bgGradient = 'from-red-500/20 via-rose-500/20 to-pink-500/30 text-red-600 dark:text-red-400';
    glyphEmblem = '⛽';
  } else if (catLower.includes('shopping')) {
    IconComponent = ShoppingBag;
    bgGradient = 'from-pink-500/20 via-rose-500/20 to-purple-500/30 text-pink-600 dark:text-pink-400';
    glyphEmblem = '🛍';
  } else if (catLower.includes('bills')) {
    IconComponent = Receipt;
    bgGradient = 'from-indigo-500/20 via-purple-500/20 to-blue-500/30 text-indigo-600 dark:text-indigo-400';
    glyphEmblem = '⚡';
  } else if (catLower.includes('family')) {
    IconComponent = Heart;
    bgGradient = 'from-emerald-500/20 via-teal-500/20 to-cyan-500/30 text-emerald-600 dark:text-emerald-400';
    glyphEmblem = '🤍';
  } else if (catLower.includes('personal')) {
    IconComponent = Fingerprint;
    bgGradient = 'from-purple-500/20 via-violet-500/20 to-fuchsia-500/30 text-purple-600 dark:text-purple-400';
    glyphEmblem = '✦';
  } else if (catLower.includes('transfer')) {
    IconComponent = ArrowRightLeft;
    bgGradient = 'from-cyan-500/20 via-blue-500/20 to-indigo-500/30 text-cyan-600 dark:text-cyan-400';
    glyphEmblem = '⇄';
  }

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-tr ${bgGradient} flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs border border-white/50 dark:border-white/10 ${sizeClasses[size]} ${className}`}
      style={color ? { color } : undefined}
      title={`${category}${subCategory ? ` › ${subCategory}` : ''}`}
    >
      <IconComponent className={iconSizes[size]} />
      {/* Creative micro-badge indicator */}
      <span className="absolute -top-1 -right-1 text-[9px] leading-none select-none drop-shadow-xs">
        {glyphEmblem}
      </span>
    </div>
  );
};

/**
 * Creative Transaction Type Symbol (Inflow, Outflow, Transfer)
 */
export const TransactionTypeSymbol: React.FC<{
  type: 'income' | 'expense' | 'transfer';
  size?: 'sm' | 'md' | 'lg';
}> = ({ type, size = 'md' }) => {
  const containerClasses = {
    sm: 'w-7 h-7 rounded-xl',
    md: 'w-9 h-9 rounded-2xl',
    lg: 'w-11 h-11 rounded-2xl',
  };

  const iconClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (type === 'income') {
    return (
      <div
        className={`${containerClasses[size]} bg-gradient-to-tr from-emerald-500/20 to-teal-400/30 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 relative`}
      >
        <ArrowDownLeft className={iconClasses[size]} />
        <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-emerald-500">
          ✦
        </span>
      </div>
    );
  }

  if (type === 'expense') {
    return (
      <div
        className={`${containerClasses[size]} bg-gradient-to-tr from-rose-500/20 to-pink-400/30 text-rose-600 dark:text-rose-400 border border-rose-400/30 flex items-center justify-center shrink-0 relative`}
      >
        <ArrowUpRight className={iconClasses[size]} />
        <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-rose-500">
          ▲
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${containerClasses[size]} bg-gradient-to-tr from-cyan-500/20 to-blue-400/30 text-cyan-600 dark:text-cyan-400 border border-cyan-400/30 flex items-center justify-center shrink-0 relative`}
    >
      <ArrowRightLeft className={iconClasses[size]} />
      <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-cyan-500">
        ⇄
      </span>
    </div>
  );
};

/**
 * Creative Currency Symbol badge (Riyal emblem `﷼` and Rupee `₹`)
 */
export const CurrencyBadge: React.FC<{
  currency: 'SAR' | 'INR';
  className?: string;
}> = ({ currency, className = '' }) => {
  if (currency === 'SAR') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold tracking-wide ${className}`}
        title="Saudi Riyal (SAR / ﷼)"
      >
        <span className="font-serif text-sm leading-none opacity-90 text-amber-600 dark:text-amber-400">
          ﷼
        </span>
        <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">SAR</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold tracking-wide ${className}`}
      title="Indian Rupee (INR / ₹)"
    >
      <span className="text-sm leading-none opacity-90 text-indigo-600 dark:text-indigo-400">
        ₹
      </span>
      <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">INR</span>
    </span>
  );
};
