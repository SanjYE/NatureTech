import { User, FileText, LayoutDashboard, HelpCircle, ClipboardList, CloudRain } from 'lucide-react';

interface MainMenuProps {
  onNavigate: (screen: 'account' | 'requests' | 'records' | 'dashboard' | 'support' | 'live-site') => void;
  user?: any;
}

export function MainMenu({ onNavigate, user }: MainMenuProps) {
  const menuItems = [
    { id: 'requests', label: 'Onboarding', icon: <FileText size={32} /> },
    { id: 'records', label: 'Farm Reports', icon: <ClipboardList size={32} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={32} /> },
    { id: 'live-site', label: 'Live Site Conditions', icon: <CloudRain size={32} /> },
    { id: 'account', label: 'Account', icon: <User size={32} /> },
    { id: 'support', label: 'Support', icon: <HelpCircle size={32} /> },
  ];

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex-1 px-6 pt-6 pb-32 overflow-y-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome {user?.full_name || 'User'}!
        </h2>
        <p className="text-gray-500 mb-8">Select a section to proceed</p>
        
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className="flex flex-col items-center justify-center p-6 rounded-[24px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(63,167,124,0.18)] hover:scale-[1.03] transition-all duration-300 aspect-square"
            >
              <div className="text-[#3FA77C] mb-3">
                {item.icon}
              </div>
              <span className="text-gray-700 font-medium text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
