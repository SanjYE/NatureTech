import { ReactNode } from 'react';

interface MenuCardProps {
  label: string;
  sub?: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  labelClassName?: string;
  className?: string;
}

export function MenuCard({ label, sub, icon, onClick, disabled = false, labelClassName, className }: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden bg-white rounded-[20px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 text-left w-full flex flex-row items-center justify-start gap-5
        ${disabled 
          ? 'opacity-60 cursor-not-allowed' 
          : 'hover:shadow-[0_8px_28px_rgba(63,167,124,0.18)] hover:scale-[1.02]'} ${className || ''}`}
    >
      <div className={`shrink-0 ${disabled ? "text-gray-400" : "text-[#3FA77C]"}`}>
        {icon}
      </div>

      <div className="flex flex-col items-start gap-0.5">
        <p className={`font-medium text-base ${labelClassName || (disabled ? "text-gray-500" : "text-gray-700")}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 line-clamp-1">{sub}</p>}
      </div>
    </button>
  );
}
