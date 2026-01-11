import { useState } from 'react';
import { ArrowLeft, User } from 'lucide-react';

interface MappingToolProps {
  onBack: () => void;
}

export function MappingTool({ onBack }: MappingToolProps) {
  const [activeTab, setActiveTab] = useState('current');

  const tabs = [
    { id: 'baseline', label: 'Baseline' },
    { id: 'current', label: 'Current Growth' },
    { id: 'analyse', label: 'Analyse' },
    { id: 'audit', label: 'Audit Tool' },
  ];

  const mapFiles: Record<string, string> = {
    baseline: '/maps/planting_blocks_fertility_layers_satellite_fixed.html',
    current: '/maps/complete_satellite.html',
    analyse: '/maps/planting_blocks_with_complete_satellite_overlay.html',
    audit: '/maps/plant_counter_web.html',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF5] to-[#F3F1E7]">
      {/* Top Navigation */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-[#3FA77C] transition-colors min-h-[44px]"
          >
            <ArrowLeft size={22} />
          </button>

          <h2 className="text-[#3FA77C]">Eye from the Sky</h2>

          <div className="w-11" />
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pt-5 space-y-4 max-w-2xl mx-auto">
        {/* Subtitle */}
        <p className="text-gray-600 text-center text-sm">
          Visualize and analyze site-level maps and growth overlays
        </p>

        {/* Tab Bar */}
        <div className="overflow-x-auto -mx-5 px-5 pb-2">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-[#3FA77C] text-white shadow-md'
                    : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Display Area */}
      <div className="w-full mt-4 bg-gray-100 shadow-inner" style={{ height: 'calc(100vh - 220px)' }}>
        <iframe 
          src={mapFiles[activeTab]} 
          className="w-full h-full border-none"
          title="Map View"
        />
      </div>
    </div>
  );
}
