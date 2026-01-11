import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, Trash2, Activity, Save, Sprout, Droplets, Tractor, HelpingHand, Loader2 } from 'lucide-react';
// import { db, auth } from '../lib/firebase';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { API_BASE_URL } from '../config';

interface OnboardSiteProps {
  onBack: () => void;
  userId: string;
  onSuccess?: (siteData: any) => void;
}

declare global {
  interface Window {
    L: any;
    turf: any;
    latestAnalysis: any;
  }
}

export function OnboardSite({ onBack, userId, onSuccess }: OnboardSiteProps) {
  const [step, setStep] = useState(1);
  const mapRef = useRef<HTMLDivElement>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Data, setStep1Data] = useState({
    name: '',
    siteCode: '',
    siteType: '',
    latitude: 0,
    longitude: 0,
    geometry: null as any
  });

  // Step 1 Inputs
  const latInputRef = useRef<HTMLInputElement>(null);
  const lonInputRef = useRef<HTMLInputElement>(null);
  const siteNameRef = useRef<HTMLInputElement>(null);
  const siteCodeRef = useRef<HTMLInputElement>(null);
  const siteTypeRef = useRef<HTMLInputElement>(null);

  // Step 2 Form Ref
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    };

    const loadStyle = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    const init = async () => {
      try {
        loadStyle('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css');

        await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js');

        setScriptsLoaded(true);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load scripts', err);
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!scriptsLoaded || !mapRef.current || step !== 1) return;

    const L = window.L;
    if (!L) return;

    if ((mapRef.current as any)._leaflet_id) return;

    const map = L.map(mapRef.current).setView([-25.5025, 28.2030], 13);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Earthstar Geographics, USGS, NOAA'
    }).addTo(map);

    const drawnItems = new L.FeatureGroup().addTo(map);
    const drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        rectangle: true,
        circle: false,
        circlemarker: false,
        marker: true,
        polygon: true
      },
      edit: {
        featureGroup: drawnItems
      }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, function (e: any) {
      const layer = e.layer;
      drawnItems.addLayer(layer);
    });

    (window as any)._mapInstance = map;
    (window as any)._drawnItems = drawnItems;

    return () => {
      map.remove();
    };
  }, [scriptsLoaded, step]);

  const handleShowPoint = () => {
    const L = window.L;
    const lat = parseFloat(latInputRef.current?.value || '0');
    const lon = parseFloat(lonInputRef.current?.value || '0');
    
    if (isNaN(lat) || isNaN(lon)) {
      alert('Enter valid lat and lon');
      return;
    }

    const drawnItems = (window as any)._drawnItems;
    const map = (window as any)._mapInstance;
    
    if (drawnItems && map) {
      L.marker([lat, lon]).addTo(drawnItems);
      map.setView([lat, lon], 16);
    }
  };

  const handleClearShapes = () => {
    const drawnItems = (window as any)._drawnItems;
    if (drawnItems) {
      drawnItems.clearLayers();
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    const L = window.L;
    const turf = window.turf;
    const drawnItems = (window as any)._drawnItems;

    if (!drawnItems || drawnItems.getLayers().length === 0) {
      alert('Draw or place a polygon/marker first');
      return;
    }

    let feature: any = null;
    let polygonFeature: any = null;
    let pointFeature: any = null;

    drawnItems.eachLayer(function (l: any) {
      if (l.toGeoJSON) {
        const geo = l.toGeoJSON();
        if (geo.geometry.type === 'Polygon' || geo.geometry.type === 'MultiPolygon') {
          polygonFeature = geo;
        } else if (geo.geometry.type === 'Point') {
          pointFeature = geo;
        }
      }
    });

    // Prefer Polygon (drawn boundary) over Point (marker)
    feature = polygonFeature || pointFeature;

    if (!feature) {
      alert('No valid geometry found');
      return;
    }

    if (feature.geometry.type === 'Point') {
      const pt = turf.point(feature.geometry.coordinates);
      const circ = turf.buffer(pt, 0.01, { units: 'kilometers' });
      feature = circ;
    }

    const area_m2 = turf.area(feature);
    let perim = 0;
    try {
      perim = turf.length(turf.polygonToLine(feature), { units: 'meters' });
    } catch (e) {
      perim = 0;
    }

    const centroid = turf.centroid(feature).geometry.coordinates;
    const centroidLat = centroid[1];
    const centroidLon = centroid[0];

    const samplePoints = [
      [centroidLat, centroidLon],
      [centroidLat + 0.0005, centroidLon],
      [centroidLat - 0.0005, centroidLon],
      [centroidLat, centroidLon + 0.0005],
      [centroidLat, centroidLon - 0.0005]
    ];

    let elevations = [null, null, null, null, null];
    try {
      const locs = samplePoints.map(p => p.join(',')).join('|');
      const eeUrl = 'https://api.open-elevation.com/api/v1/lookup?locations=' + locs;
      const r = await fetch(eeUrl);
      if (r.ok) {
        const data = await r.json();
        elevations = data.results.map((res: any) => res.elevation);
      }
    } catch (err) {
      console.warn(err);
    }

    let slope_deg: number | null = null;
    if (elevations[0] !== null && elevations[1] !== null) {
      const dz_ns = (elevations[1] as number) - (elevations[2] as number);
      const dz_ew = (elevations[3] as number) - (elevations[4] as number);
      const run_m = 111000 * 0.001;
      const gradient = Math.sqrt(Math.pow(dz_ns / run_m, 2) + Math.pow(dz_ew / run_m, 2));
      slope_deg = Math.atan(gradient) * (180 / Math.PI);
      slope_deg = Number(slope_deg.toFixed(2));
    }

    const result = {
      area_m2: area_m2,
      area_ha: area_m2 / 10000,
      perimeter_m: perim,
      centroid: { lat: centroidLat, lon: centroidLon },
      elevations: elevations,
      slope_deg: slope_deg
    };

    window.latestAnalysis = result;
    setAnalysisResult(result);

    // Auto-fill lat/lon if empty
    if (latInputRef.current && !latInputRef.current.value) {
      latInputRef.current.value = centroidLat.toFixed(6);
    }
    if (lonInputRef.current && !lonInputRef.current.value) {
      lonInputRef.current.value = centroidLon.toFixed(6);
    }
  };

  const handleNext = () => {
    if (!siteNameRef.current?.value) {
      alert('Please enter a site name');
      return;
    }
    if (!siteCodeRef.current?.value) {
      alert('Please enter a site code');
      return;
    }
    if (!siteTypeRef.current?.value) {
      alert('Please enter a site type');
      return;
    }
    if (!analysisResult) {
      alert('Please analyze the site first');
      return;
    }

    const drawnItems = (window as any)._drawnItems;
    let geometry = null;
    if (drawnItems) {
      geometry = drawnItems.toGeoJSON();
    }

    setStep1Data({
      name: siteNameRef.current.value,
      siteCode: siteCodeRef.current.value,
      siteType: siteTypeRef.current.value,
      latitude: parseFloat(latInputRef.current?.value || '0'),
      longitude: parseFloat(lonInputRef.current?.value || '0'),
      geometry: geometry
    });

    setStep(2);
  };

  const formToObject = (form: HTMLFormElement) => {
    const data: Record<string, any> = {};
    const f = new FormData(form);
    for (const pair of f.entries()) {
      const k = pair[0];
      const v = pair[1];
      if (k === 'support') {
        data.support = data.support || [];
        data.support.push(v);
      } else {
        data[k] = v;
      }
    }
    if (!data.support) data.support = [];
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = formToObject(formRef.current);

      const siteData = {
        userId: userId,
        name: step1Data.name,
        siteCode: step1Data.siteCode,
        siteType: step1Data.siteType,
        countryCode: formData.country,
        adminArea: formData.adminArea,
        latitude: step1Data.latitude,
        longitude: step1Data.longitude,
        geom: JSON.stringify(step1Data.geometry),
        elevation_m: analysisResult.elevations[0],
        area_ha: analysisResult.area_ha,
        
        // Additional Data
        location: {
          nearestTown: formData.nearestTown || '',
          gpsProvided: formData.gpsProvided || ''
        },
        operations: {
          currentCrops: formData.currentCrops || '',
          livestock: formData.livestockPresent || '',
          livestockType: formData.livestockType || ''
        },
        resources: {
          soilTest: formData.soilTest || '',
          irrigation: formData.irrigation || '',
          waterSources: formData.waterSources || ''
        },
        infrastructure: {
          machinery: formData.machinery || '',
          pests: formData.pests || '',
          climateIssues: formData.climateIssues || ''
        },
        support: formData.support,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      // await addDoc(collection(db, 'sites'), siteData);
      
      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit');
      }

      const result = await response.json();
      console.log('Site created:', result);

      alert('Site onboarded successfully!');
      if (onSuccess) {
        onSuccess(result.site.site_id, result.site.name);
      } else {
        onBack();
      }
    } catch (error: any) {
      console.error("Error adding document: ", error);
      alert(`Error submitting form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className="flex-1 flex flex-col bg-[#FAFAF5] h-full">
        <div className="px-6 pt-2 pb-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-[#3FA77C] transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Menu</span>
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">Onboard Site - Step 1</h2>
          <p className="text-gray-500 text-sm">Identify and Analyze Site</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {loading && (
            <div className="flex items-center justify-center p-8 text-gray-500">
              Loading map resources...
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 bg-white rounded-[24px] p-4 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 block">Site Name</label>
                  <input 
                    ref={siteNameRef}
                    type="text" 
                    placeholder="e.g. North Field" 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#3FA77C]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 block">Site Code</label>
                  <input 
                    ref={siteCodeRef}
                    type="text" 
                    placeholder="e.g. Z1" 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#3FA77C]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 block">Site Type</label>
                  <input 
                    ref={siteTypeRef}
                    type="text" 
                    placeholder="e.g. Farm, Plantation" 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#3FA77C]"
                  />
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <div className="w-1/2 space-y-2">
                    <label className="text-xs text-gray-500 block">Latitude</label>
                    <input ref={latInputRef} type="text" placeholder="e.g. -25.74" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                  </div>
                  <div className="w-1/2 space-y-2">
                    <label className="text-xs text-gray-500 block">Longitude</label>
                    <input ref={lonInputRef} type="text" placeholder="e.g. 28.22" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={handleShowPoint} className="flex items-center gap-1 px-3 py-2 bg-[#3FA77C] text-white rounded-lg text-sm font-medium hover:bg-[#2e8560]">
                  <MapPin size={16} /> Show Point
                </button>
                <button onClick={handleAnalyze} className="flex items-center gap-1 px-3 py-2 bg-[#3FA77C] text-white rounded-lg text-sm font-medium hover:bg-[#2e8560]">
                  <Activity size={16} /> Analyze
                </button>
                <button onClick={handleClearShapes} className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                  <Trash2 size={16} /> Clear
                </button>
              </div>

              <div 
                ref={mapRef} 
                className="w-full h-[400px] rounded-xl border border-gray-200 z-0"
                style={{ minHeight: '400px' }}
              />

              {analysisResult && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
                  <h3 className="font-semibold text-[#1b6b3a] mb-2">Analysis Results</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Area</span>
                      <span className="font-medium">{analysisResult.area_ha.toFixed(4)} ha</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Perimeter</span>
                      <span className="font-medium">{Math.round(analysisResult.perimeter_m)} m</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Elevation</span>
                      <span className="font-medium">{analysisResult.elevations[0] || 'N/A'} m</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Slope</span>
                      <span className="font-medium">{analysisResult.slope_deg || 'N/A'}°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full lg:w-80 flex flex-col gap-4">
              <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-3">Actions</h3>
                <button 
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3FA77C] text-white rounded-xl text-sm font-medium hover:bg-[#2e8560]"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAF5] relative z-0">
      <div className="flex-none bg-[#FAFAF5]/95 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setStep(1)}
            className="p-2 -ml-2 text-gray-600 hover:text-[#3FA77C] hover:bg-[#3FA77C]/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-800">Onboard Site - Step 2</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            
            {/* Location */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 text-[#3FA77C]">
                  <div className="p-2 bg-[#3FA77C]/10 rounded-lg">
                    <MapPin size={20} />
                  </div>
                  <CardTitle className="text-lg text-gray-800">Location Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <Input name="country" placeholder="e.g. South Africa" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Admin Area</label>
                  <Input name="adminArea" placeholder="e.g. Gauteng" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nearest Town</label>
                  <Input name="nearestTown" placeholder="e.g. Witbank" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">GPS Boundary</label>
                  <Input name="gpsProvided" placeholder="e.g. Yes / No" className="bg-white" />
                </div>
              </CardContent>
            </Card>

            {/* Operations */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 text-[#3FA77C]">
                  <div className="p-2 bg-[#3FA77C]/10 rounded-lg">
                    <Sprout size={20} />
                  </div>
                  <CardTitle className="text-lg text-gray-800">Operations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Main Crops</label>
                  <Input name="currentCrops" placeholder="e.g. Maize, Soybeans, Wheat" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Livestock</label>
                  <Input name="livestockPresent" placeholder="e.g. Yes / No" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Livestock Type</label>
                  <Input name="livestockType" placeholder="e.g. Cattle, Sheep (if applicable)" className="bg-white" />
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 text-[#3FA77C]">
                  <div className="p-2 bg-[#3FA77C]/10 rounded-lg">
                    <Droplets size={20} />
                  </div>
                  <CardTitle className="text-lg text-gray-800">Resources</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Soil Test</label>
                  <Input name="soilTest" placeholder="e.g. Yes / No" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Irrigation</label>
                  <Input name="irrigation" placeholder="e.g. Drip, Pivot, None" className="bg-white" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Water Sources</label>
                  <Input name="waterSources" placeholder="e.g. Borehole, River" className="bg-white" />
                </div>
              </CardContent>
            </Card>

            {/* Infrastructure */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 text-[#3FA77C]">
                  <div className="p-2 bg-[#3FA77C]/10 rounded-lg">
                    <Tractor size={20} />
                  </div>
                  <CardTitle className="text-lg text-gray-800">Infrastructure & Risks</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Machinery</label>
                  <Input name="machinery" placeholder="e.g. Tractor, Harvester" className="bg-white" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Pests & Diseases</label>
                    <Input name="pests" placeholder="Known issues" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Climate Issues</label>
                    <Input name="climateIssues" placeholder="e.g. Drought, Frost" className="bg-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 text-[#3FA77C]">
                  <div className="p-2 bg-[#3FA77C]/10 rounded-lg">
                    <HelpingHand size={20} />
                  </div>
                  <CardTitle className="text-lg text-gray-800">Support & Goals</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Required Support</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['Soil improvement', 'Crop planning', 'Irrigation', 'Agroforestry', 'Carbon', 'Other'].map((item) => (
                      <label key={item} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 bg-white hover:border-[#3FA77C]/30 hover:bg-[#3FA77C]/5 cursor-pointer transition-all">
                        <input type="checkbox" name="support" value={item} className="w-4 h-4 text-[#3FA77C] rounded border-gray-300 focus:ring-[#3FA77C]" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                Back
              </Button>
              <Button onClick={() => formRef.current?.requestSubmit()} className="flex-1 h-12 bg-[#3FA77C] hover:bg-[#2e8560] text-white" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span className="text-base">{isSubmitting ? 'Save Site' : 'Save Site'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
