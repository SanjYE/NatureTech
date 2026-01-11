import { useState, useEffect } from 'react';
import { ArrowLeft, Map as MapIcon, Layers, Ruler, Mountain, Loader2, Navigation, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface SitesAndPlantationPageProps {
  user: any;
  onBack: () => void;
}

export function SitesAndPlantationPage({ user, onBack }: SitesAndPlantationPageProps) {
  const [sites, setSites] = useState<any[]>([]);
  const [siteUnits, setSiteUnits] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSite, setExpandedSite] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        if (!user.organisationId) return;

        // Fetch Sites
        const sitesRes = await fetch(`${API_BASE_URL}/sites?organisationId=${user.organisationId}`);
        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          setSites(sitesData);
          
          // Fetch units for each site
          const unitsMap: Record<string, any[]> = {};
          for (const site of sitesData) {
              const unitsRes = await fetch(`${API_BASE_URL}/site-units?siteId=${site.site_id}`);
              if (unitsRes.ok) {
                  unitsMap[site.site_id] = await unitsRes.json();
              }
          }
          setSiteUnits(unitsMap);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, [user]);

  const toggleExpand = (siteId: string) => {
      setExpandedSite(expandedSite === siteId ? null : siteId);
  }

  if (loading) {
      return (
          <div className="flex justify-center items-center h-full min-h-[400px]">
              <Loader2 className="animate-spin text-[#3FA77C]" size={32} />
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAF5]">
      <div className="px-6 pt-4 sticky top-0 bg-[#FAFAF5]/90 backdrop-blur z-10 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#3FA77C] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Account</span>
        </button>
      </div>

      <div className="px-6 pb-12 flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-6 mt-4">
            
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Sites & Plantations</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your land assets and production units.</p>
            </header>

            {sites.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-gray-300">
                    <MapIcon size={40} className="text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-600 font-medium">No sites found</h3>
                </div>
            ) : (
                sites.map((site) => (
                    <div key={site.site_id} className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300">
                        <div 
                            className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleExpand(site.site_id)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className="bg-[#3FA77C]/10 p-3 rounded-xl text-[#3FA77C]">
                                        <MapIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{site.name}</h3>
                                        <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">{site.site_code}</p>
                                    </div>
                                </div>
                                {expandedSite === site.site_id ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={16} className="text-gray-400" />
                                    <span>{site.admin_area}, {site.country_code}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Ruler size={16} className="text-gray-400" />
                                    <span>{site.area_ha} ha</span>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details - Units */}
                        {expandedSite === site.site_id && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <Layers size={16} /> Site Units
                                    </h4>
                                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                                        {siteUnits[site.site_id]?.length || 0} Units
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {siteUnits[site.site_id]?.length > 0 ? (
                                        siteUnits[site.site_id].map((unit) => (
                                            <div key={unit.unit_id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-8 bg-[#3FA77C] rounded-full"></div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{unit.name}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{unit.unit_type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-medium text-gray-600">{unit.area_ha} ha</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 italic pl-2">No units defined yet.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
