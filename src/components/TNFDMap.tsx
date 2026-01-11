import { ArrowLeft } from 'lucide-react';

interface TNFDMapProps {
  onBack: () => void;
}

export function TNFDMap({ onBack }: TNFDMapProps) {
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

          <h2 className="text-[#3FA77C]">TNFD Map</h2>

          <div className="w-11" />
        </div>
      </div>

      {/* Map Display Area */}
      <div className="w-full mt-4 bg-gray-100 shadow-inner" style={{ height: 'calc(100vh - 100px)' }}>
        <iframe 
          src="/maps/TNFD_interactive_map_composite_TNFD_tooltips_v6.html" 
          className="w-full h-full border-none"
          title="TNFD Map View"
        />
      </div>
    </div>
  );
}
