import { useState } from 'react';
import { MapPin, Sprout, ShoppingBag, ArrowLeft } from 'lucide-react';
import { OnboardSite } from '../components/OnboardSite';

interface RequestsProps {
  onBack: () => void;
  userId: string;
  onSiteCreated: (siteId: string, siteName: string) => void;
}

export function Requests({ onBack, userId, onSiteCreated }: RequestsProps) {
  const [currentView, setCurrentView] = useState<string | null>(null);

  const menuItems = [
    { id: 'site', icon: <MapPin size={40} />, label: 'Onboard Site', sub: 'Register a new site' },
    { id: 'plantation', icon: <Sprout size={40} />, label: 'Onboard Plantation', sub: 'Add plantation details' },
    { id: 'marketplace', icon: <ShoppingBag size={40} />, label: 'Purchase Product / Service', sub: 'Marketplace' },
  ];

  if (currentView === 'site') {
    return (
      <OnboardSite 
        userId={userId} 
        onBack={() => setCurrentView(null)} 
        onSuccess={onSiteCreated}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#3FA77C] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Menu</span>
        </button>
      </div>

      <div className="flex-1 px-6 pt-8 pb-24 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Onboarding</h2>
          <div className="flex flex-col gap-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className="flex flex-col items-center justify-center p-8 rounded-[24px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(63,167,124,0.18)] hover:scale-[1.02] transition-all duration-300 w-full"
              >
                <div className="text-[#3FA77C] mb-4">
                  {item.icon}
                </div>
                <div className="text-center">
                  <span className="block text-xl font-medium text-gray-700 mb-1">{item.label}</span>
                  <span className="block text-sm text-gray-400">{item.sub}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
