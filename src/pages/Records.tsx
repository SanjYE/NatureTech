import { useState } from 'react';
import { ClipboardList, FileBarChart, ShieldCheck, ClipboardCheck, ArrowLeft, PenTool } from 'lucide-react';
import { CaptureFieldData } from '../components/CaptureFieldData';
import { FarmActionLog } from '../components/FarmActionLog';

interface RecordsProps {
  onBack: () => void;
  user: any;
}

export function Records({ onBack, user }: RecordsProps) {
  const [currentView, setCurrentView] = useState<string | null>(null);

  const menuItems = [
    { id: 'capture', icon: <PenTool size={40} />, label: 'Capture Field Data', sub: 'Log observations & measurements' },
    { id: 'farm', icon: <ClipboardList size={40} />, label: 'Farm Records', sub: 'Day-to-day logs: Field Activity, Workers' },
    { id: 'soil', icon: <FileBarChart size={40} />, label: 'Soil & Environmental Reports', sub: 'Soil Health, Carbon Assessments' },
    { id: 'compliance', icon: <ShieldCheck size={40} />, label: 'Compliance & Certification', sub: 'Global G.A.P, TNFD Evidence' },
    { id: 'assessments', icon: <ClipboardCheck size={40} />, label: 'Site & Plantation Assessments', sub: 'Crop Performance, Risk Assessment' },
  ];

  if (currentView === 'capture') {
    return <CaptureFieldData onBack={() => setCurrentView(null)} userEmail={user.email} />;
  }

  if (currentView === 'farm') {
    return <FarmActionLog onBack={() => setCurrentView(null)} user={user} />;
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Farm Reports</h2>
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
