import { cn } from '../../lib/cn';

const DEFAULT_STATUS_STYLES = {
  Active: 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse',
  Converted: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Working: 'bg-blue-50 text-blue-600 border-blue-200',
  Lost: 'bg-red-50 text-red-600 border-red-200',
  Draft: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function Badge({ status, styles, className }) {
  const styleMap = styles || DEFAULT_STATUS_STYLES;
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider whitespace-nowrap',
        styleMap[status] || styleMap.Draft || DEFAULT_STATUS_STYLES.Draft,
        className
      )}
    >
      {status}
    </span>
  );
}
