import { useState, useEffect } from 'react';
import { ArrowLeft, CloudRain, Thermometer, Droplets, Wind } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface LiveSiteConditionsProps {
  onBack: () => void;
  user?: any;
}

export function LiveSiteConditions({ onBack, user }: LiveSiteConditionsProps) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
       try {
           if (!user || !user.organisationId) {
               throw new Error("No Organisation ID found.");
           }

           // 1. Fetch Site for the Org
           const sitesRes = await fetch(`${API_BASE_URL}/sites?organisationId=${user.organisationId}`);
           if (!sitesRes.ok) throw new Error("Failed to fetch sites");
           
           const sites = await sitesRes.json();
           if (!sites || sites.length === 0) {
              throw new Error("No sites found for this organisation.");
           }
           
           // Use the first site found
           const site = sites[0];
           setSiteName(site.name);
           
           if (!site.latitude || !site.longitude) {
              throw new Error(`Site "${site.name}" is missing coordinates.`);
           }

           console.log(`Fetching weather for ${site.name} at ${site.latitude}, ${site.longitude}`);

           // 2. Fetch Weather Data (Open-Meteo)
           const weatherRes = await fetch(
               `https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&wind_speed_unit=kmh`
           );
           
           if (!weatherRes.ok) throw new Error("Weather service unavailable");
           
           const weatherData = await weatherRes.json();
           setWeather(weatherData.current);

       } catch (err: any) {
           console.error(err);
           setError(err.message || 'Error loading data');
       } finally {
           setLoading(false);
       }
    };

    fetchData();
  }, [user]);

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
             <div className="p-8 text-center text-gray-500">Loading live weather data...</div>
          ) : error ? (
             <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center mb-6">
                <p className="font-bold">Unavailable</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-2 text-gray-500">Ensure you have created a Site with valid coordinates.</p>
             </div>
          ) : (
            <>
                <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                    Monitoring: <span className="font-bold text-[#1b6b3a]">{siteName}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Live</span>
                </p>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
