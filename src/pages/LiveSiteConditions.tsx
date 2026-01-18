import { useState, useEffect } from 'react';
import { ArrowLeft, CloudRain, Thermometer, Droplets, Wind, ChevronDown, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface LiveSiteConditionsProps {
  onBack: () => void;
  user?: any;
}

export function LiveSiteConditions({ onBack, user }: LiveSiteConditionsProps) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);

  useEffect(() => {
    const fetchSites = async () => {
       try {
           if (!user || !user.organisationId) {
               throw new Error("No Organisation ID found.");
           }

           // 1. Fetch Sites for the Org
           const sitesRes = await fetch(`${API_BASE_URL}/sites?organisationId=${user.organisationId}`);
           if (!sitesRes.ok) throw new Error("Failed to fetch sites");
           
           const fetchedSites = await sitesRes.json();
           if (!fetchedSites || fetchedSites.length === 0) {
              throw new Error("No sites found for this organisation.");
           }
           
           setSites(fetchedSites);
           // Use the first site found by default
           setSelectedSite(fetchedSites[0]);
           
       } catch (err: any) {
           console.error(err);
           setError(err.message || 'Error loading data');
       } finally {
           setLoading(false);
       }
    };

    fetchSites();
  }, [user]);

  useEffect(() => {
    const fetchWeather = async () => {
        if (!selectedSite) return;

        if (!selectedSite.latitude || !selectedSite.longitude) {
           console.warn(`Site "${selectedSite.name}" is missing coordinates.`);
           setWeather(null);
           return;
        }

        setWeatherLoading(true);
        console.log(`Fetching weather for ${selectedSite.name} at ${selectedSite.latitude}, ${selectedSite.longitude}`);

        try {
           // 2. Fetch Weather Data (Open-Meteo)
           const weatherRes = await fetch(
               `https://api.open-meteo.com/v1/forecast?latitude=${selectedSite.latitude}&longitude=${selectedSite.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&wind_speed_unit=kmh`
           );
           
           if (!weatherRes.ok) throw new Error("Weather service unavailable");
           
           const weatherData = await weatherRes.json();
           setWeather(weatherData.current);
        } catch (err) {
            console.error("Error fetching weather:", err);
            setWeather(null);
        } finally {
            setWeatherLoading(false);
        }
    };

    fetchWeather();
  }, [selectedSite]);

  const conditions = [
    { 
        id: 'precip', 
        label: 'Precipitation', 
        value: weather ? `${weather.precipitation} mm` : '--', 
        icon: <CloudRain size={40} /> 
    },
    { 
        id: 'temp', 
        label: 'Temperature', 
        value: weather ? `${weather.temperature_2m} °C` : '--', 
        icon: <Thermometer size={40} /> 
    },
    { 
        id: 'humidity', 
        label: 'Humidity', 
        value: weather ? `${weather.relative_humidity_2m} %` : '--', 
        icon: <Droplets size={40} /> 
    },
    { 
        id: 'wind', 
        label: 'Wind', 
        value: weather ? `${weather.wind_speed_10m} km/h` : '--', 
        icon: <Wind size={40} /> 
    }
  ];

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
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Live Site Conditions</h2>
          
          {loading ? (
             <div className="p-8 text-center text-gray-500">Loading sites...</div>
          ) : error ? (
             <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center mb-6">
                <p className="font-bold">Unavailable</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-2 text-gray-500">Ensure you have created a Site with valid coordinates.</p>
             </div>
          ) : (
            <>
                <div className="bg-white rounded-xl p-4 shadow-sm mb-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                         <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monitoring Site</label>
                         {sites.length > 1 && <span className="text-xs text-[#3FA77C] font-medium bg-green-50 px-2 py-0.5 rounded-full">{sites.length} Available</span>}
                    </div>
                    
                    {sites.length > 1 ? (
                        <div className="relative">
                            <select
                                value={selectedSite?.site_id || ''}
                                onChange={(e) => {
                                    const newSite = sites.find(s => s.site_id === e.target.value);
                                    if (newSite) setSelectedSite(newSite);
                                }}
                                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-base rounded-lg p-3 pr-10 focus:ring-[#3FA77C] focus:border-[#3FA77C] font-medium outline-none transition-all"
                            >
                                {sites.map(site => (
                                    <option key={site.site_id} value={site.site_id}>
                                        {site.name} {site.site_code ? `(${site.site_code})` : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 font-medium">
                            <MapPin size={20} className="text-[#3FA77C]" />
                            {selectedSite?.name || 'Unknown Site'}
                        </div>
                    )}
                    
                     {selectedSite && (
                         <div className="mt-2 text-xs text-gray-400 flex items-center gap-1 pl-1">
                             Coord: {selectedSite.latitude?.toFixed(4)}, {selectedSite.longitude?.toFixed(4)}
                         </div>
                     )}
                </div>

                {weatherLoading ? (
                     <div className="py-12 flex flex-col items-center justify-center text-gray-400 animate-pulse">
                         <CloudRain size={48} className="mb-4 opacity-50" />
                         <span>Fetching satellite weather data...</span>
                     </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {conditions.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col items-center justify-center p-8 rounded-[24px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(63,167,124,0.18)] hover:scale-[1.02] transition-all duration-300 w-full"
                        >
                            <div className="text-[#3FA77C] mb-4">
                            {item.icon}
                            </div>
                            <div className="text-center">
                            <span className="block text-xl font-medium text-gray-700 mb-1">{item.label}</span>
                            <span className="block text-sm text-gray-500 mt-1">{item.value}</span>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
