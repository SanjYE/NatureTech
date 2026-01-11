import { MessageCircle, Award, Users, ArrowLeft } from 'lucide-react';

interface SupportProps {
  onBack: () => void;
}

export function Support({ onBack }: SupportProps) {
  const menuItems = [
    { id: 'support', icon: <MessageCircle size={40} />, label: 'Contact TERRAGRN Support', sub: 'Get help via WhatsApp' },
    { id: 'expert', icon: <Award size={40} />, label: 'Help from a Certified Expert', sub: 'Consult with a local expert' },
    { id: 'community', icon: <Users size={40} />, label: 'Help from Members', sub: 'Community forum' },
  ];

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
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Support</h2>
          
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-amber-800 font-medium">This feature is coming soon</p>
            <p className="text-amber-600 text-sm mt-1">We are currently setting up our support channels.</p>
          </div>

          <div className="flex flex-col gap-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
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
