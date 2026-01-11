import { ReactNode } from 'react';

interface DashboardCardProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

export function DashboardCard({ label, icon, onClick }: DashboardCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden bg-white rounded-[24px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(63,167,124,0.18)] hover:scale-[1.03] transition-all duration-300 text-center w-full h-full flex flex-col items-center justify-center gap-4"
    >
      <div className="text-[#3FA77C]">
        {icon}
      </div>

      <p className="text-gray-700">{label}</p>
    </button>
  );
}
