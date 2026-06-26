import { cn } from '../../lib/cn';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/40 border border-white/40',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
