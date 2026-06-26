import Link from 'next/link';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
  ghost: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
  danger: 'text-slate-400 hover:text-red-600 hover:bg-red-50',
};

const SIZES = {
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  icon: 'p-2 rounded-lg',
};

export default function Button({ href, variant = 'primary', size = 'md', icon: Icon, className, children, ...props }) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium transition-all whitespace-nowrap',
    VARIANTS[variant],
    SIZES[size],
    className
  );

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
}
