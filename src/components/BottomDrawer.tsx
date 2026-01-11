import { useState, useEffect } from 'react';
import { Thermometer, Droplets, CloudRain, Wind, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}

function MetricCard({ icon, label, value, unit }: MetricCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/50 w-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-[#3FA77C] p-2.5 bg-[#3FA77C]/10 rounded-full">
          {icon}
        </div>
        <span className="text-base text-gray-700 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5 pl-1">
        <span className="text-3xl text-gray-900 font-bold">{value}</span>
        <span className="text-base text-gray-500 font-medium">{unit}</span>
      </div>
    </div>
  );
}

interface BottomDrawerProps {
  onToggle: (isOpen: boolean) => void;
  user?: any;
}

export function BottomDrawer({ onToggle, user }: BottomDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Weather State
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string>('');

  useEffect(() => {
    // Only fetch when expanded to save resources, or on mount if you prefer pre-loading
    // Fetching on mount ensures data is ready when they slide it up
    const fetchData = async () => {
       try {
           if (!user || !user.organisationId) {
               // Silent fail or default
               return; 
           }

           // 1. Fetch Site for the Org
           const sitesRes = await fetch(`${API_BASE_URL}/sites?organisationId=${user.organisationId}`);
           if (!sitesRes.ok) throw new Error("Failed to fetch sites");
           
           const sites = await sitesRes.json();
           if (!sites || sites.length === 0) {
              // No sites
              return;
           }
           
           // Use the first site found
           const site = sites[0];
           setSiteName(site.name);
           
           if (!site.latitude || !site.longitude) {
              return;
           }

           // 2. Fetch Weather Data (Open-Meteo)
           const weatherRes = await fetch(
               `https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&wind_speed_unit=kmh`
           );
           
           if (!weatherRes.ok) throw new Error("Weather service unavailable");
           
           const weatherData = await weatherRes.json();
           setWeather(weatherData.current);

       } catch (err: any) {
           console.error(err);
           setError(err.message);
       } finally {
           setLoading(false);
       }
    };

    fetchData();
  }, [user]);

  const handleToggle = (expanded: boolean) => {
    setIsExpanded(expanded);
    onToggle(expanded);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;

    if (diff > 50 && !isExpanded) {
      handleToggle(true);
    } else if (diff < -50 && isExpanded) {
      handleToggle(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* Backdrop blur overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 transition-all duration-300"
          onClick={() => handleToggle(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out z-50 ${isExpanded ? 'bottom-0 h-[70vh]' : 'bottom-0 h-8 cursor-pointer'
          }`}
        onClick={() => !isExpanded && handleToggle(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-2" onClick={(e) => { e.stopPropagation(); handleToggle(!isExpanded); }}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(!isExpanded); }}
            className="w-full py-2 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors"
          >
            <span className="text-gray-700 font-bold">Live Site Conditions 🌤️</span>
            {siteName && <span className="text-xs text-[#3FA77C] font-medium">{siteName}</span>}
          </button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="px-6 pb-8 pt-4 overflow-y-auto h-[calc(100%-4rem)]">
            <div className="space-y-6 max-w-md mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
               {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading conditions...</div>
               ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
               ) : !weather ? (
                    <div className="text-center py-10 text-gray-500">No data available. Check organization setup.</div>
               ) : (
                   <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                            icon={<CloudRain size={24} />}
                            label="Precipitation"
                            value={String(weather.precipitation)}
                            unit="mm"
                        />
                        <MetricCard
                            icon={<Thermometer size={24} />}
                            label="Temperature"
                            value={String(weather.temperature_2m)}
                            unit="°C"
                        />
                        <MetricCard
                            icon={<Droplets size={24} />}
                            label="Humidity"
                            value={String(weather.relative_humidity_2m)}
                            unit="%"
                        />
                        <MetricCard
                            icon={<Wind size={24} />}
                            label="Wind"
                            value={String(weather.wind_speed_10m)}
                            unit="km/h"
                        />
                    </div>
               )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
