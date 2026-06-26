import { Search } from 'lucide-react';
import { cn } from '../../lib/cn';

export default function PageHeader({ icon: Icon, title, subtitle, search, actions, className }) {
  return (
    <div className={cn('flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4', className)}>
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          {Icon && <Icon className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />}
          {title}
        </h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
        {search && (
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={search.placeholder || 'Search...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}
