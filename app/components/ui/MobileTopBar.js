import { Menu } from 'lucide-react';

export default function MobileTopBar({ onMenuClick }) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm">
      <div className="font-bold text-slate-800">Champion Security</div>
      <button onClick={onMenuClick} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
}
