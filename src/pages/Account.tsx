import { useState } from 'react';
import { User, Building2, Wifi, Map, CreditCard, Settings, FileText, ArrowLeft, LogOut } from 'lucide-react';
import { ProfilePage } from './ProfilePage';
import { MyOrganisationPage } from './MyOrganisationPage';
import { SitesAndPlantationPage } from './SitesAndPlantationPage';
import { ConnectedDevicesPage } from './ConnectedDevicesPage';

interface AccountProps {
  onBack: () => void;
  onLogout?: () => void;
  user: any;
}

export function Account({ onBack, onLogout, user }: AccountProps) {
  const [currentView, setCurrentView] = useState<string | null>(null);

  const menuItems = [
    { id: 'profile', icon: <User size={40} />, label: 'Profile', sub: 'View / Edit Profile' },
    { id: 'org', icon: <Building2 size={40} />, label: 'My Organisation', sub: 'Organisation Profile, Team Members' },
    { id: 'devices', icon: <Wifi size={40} />, label: 'Connected Devices', sub: 'Sensors, LoRa Nodes' },
    { id: 'sites', icon: <Map size={40} />, label: 'Sites & Plantations', sub: 'List Sites, View Properties' },
    { id: 'billing', icon: <CreditCard size={40} />, label: 'Subscription & Billing', sub: 'Manage Plan' },
    { id: 'settings', icon: <Settings size={40} />, label: 'App Settings', sub: 'Dark Mode, Data Permission' },
    { id: 'legal', icon: <FileText size={40} />, label: 'Legal & Info', sub: 'Privacy Policy, Terms' },
  ];

  // Placeholder component for sub-pages
  const PlaceholderPage = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#3FA77C] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Account</span>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-500">This feature is coming soon.</p>
        </div>
      </div>
    </div>
  );

  if (currentView === 'profile') {
      return <ProfilePage user={user} onBack={() => setCurrentView(null)} />;
  }
  if (currentView === 'org') {
      return <MyOrganisationPage user={user} onBack={() => setCurrentView(null)} />;
  }
  if (currentView === 'sites') {
      return <SitesAndPlantationPage user={user} onBack={() => setCurrentView(null)} />;
  }
  if (currentView === 'devices') {
      return <ConnectedDevicesPage user={user} onBack={() => setCurrentView(null)} />;
  }

  if (currentView) {
    const item = menuItems.find(i => i.id === currentView);
    return <PlaceholderPage title={item?.label || ''} onBack={() => setCurrentView(null)} />;
  }

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="px-6 pt-2 sticky top-0 bg-[#FAFAF5] z-10 pb-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#3FA77C] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Menu</span>
        </button>
      </div>

      <div className="px-6 pt-6">
        <div className="w-full max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Account</h2>
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

            <button
              onClick={onLogout}
              className="flex flex-col items-center justify-center p-8 rounded-[24px] bg-red-50 hover:bg-red-100/80 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:scale-[1.02] transition-all duration-300 w-full"
            >
              <div className="text-red-500 mb-4">
                <LogOut size={40} />
              </div>
              <div className="text-center">
                <span className="block text-xl font-medium text-red-600 mb-1">Log Out</span>
                <span className="block text-sm text-red-400">Sign out of your account</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
