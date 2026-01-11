import { useState, useEffect } from 'react';
import { User, HelpCircle, Bell, LogOut } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface TopNavBarProps {
  onNavigate?: (screen: 'support' | 'dashboard' | 'alerts') => void;
  onLogout?: () => void;
  user?: any;
}

export function TopNavBar({ onNavigate, onLogout, user }: TopNavBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/alerts`);
        if (res.ok) {
          const data = await res.json();
          // Check if there are any active alerts
          const activeAlerts = data.filter((a: any) => a.status === 'active');
          console.log('TopNavBar polling:', activeAlerts.length, 'active alerts found');
          setHasAlerts(activeAlerts.length > 0);
        }
      } catch (e) {
        console.error("Error polling alerts:", e);
      }
    };
    
    checkAlerts();
    const interval = setInterval(checkAlerts, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-transparent">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <img 
            src="/image1.png" 
            alt="TERRAGRN" 
            className="w-auto object-contain" 
            style={{ height: '32px' }} 
          />
          <span 
            style={{ 
              color: '#1b775bff', 
              fontSize: '15px', 
              fontWeight: '700',
              letterSpacing: '-0.025em'
            }}
          >
            Nature-Tech
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasAlerts && (
            <button 
              onClick={() => onNavigate?.('alerts')}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-50 transition-colors mr-1"
              title="View Alerts"
            >
              <div 
                style={{ 
                    width: '14px', 
                    height: '14px', 
                    backgroundColor: '#ef4444', 
                    borderRadius: '50%',
                    boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.2)'
                }} 
                className="animate-pulse"
              />
            </button>
          )}

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="rounded-full bg-gradient-to-br from-[#3FA77C] to-[#2d8a63] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-md"
            style={{ width: '32px', height: '32px' }}
          >
            <User size={18} />
          </button>
        </div>
      </div>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div 
            className="absolute right-6 bg-white rounded-2xl shadow-lg p-4 z-20 w-64"
            style={{ top: '48px' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3FA77C] to-[#2d8a63] flex items-center justify-center text-white">
                <User size={24} />
              </div>
              <div>
                <h3>{user?.full_name || 'Guest'}</h3>
                <p className="text-gray-600">{user?.role ? user.role.toUpperCase() : 'TERRAGRN PVT LTD'}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">TNFD Compliance</span>
                <span className="text-[#3FA77C]">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-[#3FA77C] h-2 rounded-full" style={{ width: '87%' }} />
              </div>
            </div>

            <button
              onClick={() => {
                setShowDropdown(false);
                onNavigate?.('support');
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <HelpCircle size={18} />
              <span className="text-sm font-medium">Support</span>
            </button>

            <button
              onClick={() => {
                setShowDropdown(false);
                onLogout?.();
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
