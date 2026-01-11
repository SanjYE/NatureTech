import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Scan, MapPin, FileText, Download, Upload, Plus, Loader2 } from 'lucide-react';

interface CaptureFieldDataProps {
  onBack: () => void;
  userEmail: string;
}

export function CaptureFieldData({ onBack, userEmail }: CaptureFieldDataProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setIsSubmitting(true);
    const formData = new FormData(formRef.current);
    
    const data = {
        barcode: formData.get('barcode'),
        // Manual Fields
        manualSiteCode: formData.get('manualSiteCode'),
        manualBlockId: formData.get('manualBlockId'),
        manualGridNum: formData.get('manualGridNum'),
        manualRowNum: formData.get('manualRowNum'),
        manualPlantNum: formData.get('manualPlantNum'),
        manualSpeciesCode: formData.get('manualSpeciesCode'),

        submittedBy: userEmail,
        submittedOn: new Date().toISOString(),
        gps: null,
        spotsOnLeaves: formData.get('spots'),
        yellowLeaves: formData.get('yellowLeaves'),
        droopingLeaves: formData.get('drooping'),
        visiblePests: formData.get('visiblePest'),
        recentPestDamage: formData.get('recentPestDamage'),
        typeOfPest: formData.get('typeOfPest'),
        diameterAtBase: formData.get('diameterAtBase'),
        notes: formData.get('notes'),
        // New fields
        berryType: formData.get('berryType'),
        fixerName: formData.get('fixerName'),
        oldBambooNumberofculms: formData.get('oldBambooNumberofculms'),
        oldBambooMarkercolour: formData.get('oldBambooMarkercolour'),
        oldBambooDiameteratbase: formData.get('oldBambooDiameteratbase'),
        oldBambooCulmheight: formData.get('oldBambooCulmheight'),
        newBambooShoots: formData.get('newBambooShoots'),
        newBambooMarkercolour: formData.get('newBambooMarkercolour'),
        newBambooShootheight: formData.get('newBambooShootheight'),
        fruitHeight: formData.get('fruitHeight'),
        fruitDiameter: formData.get('fruitDiameter'),
        fruitNumberofbranches: formData.get('fruitNumberofbranches'),
        fruitNumberofflowerclusters: formData.get('fruitNumberofflowerclusters'),
        fruitNumberoffruit: formData.get('fruitNumberoffruit'),
        sufficientMulch: formData.get('sufficientMulch'),
        sufficientCompostManure: formData.get('sufficientCompostManure'),
        soilMoisture: formData.get('soilMoisture'),
        electricalConductivity: formData.get('electricalConductivity'),
        pHValue: formData.get('pHValue'),
        temperature: formData.get('temperature'),
        moisture: formData.get('moisture'),
        
        // Advanced Environmental
        rainfall: formData.get('rainfall'),
        et: formData.get('et'),
        slope: formData.get('slope'),
        fireFlag: formData.get('fireFlag'), // Checkbox usually returns 'Yes' or 'on'
        esp: formData.get('esp'),
        bulkDensity: formData.get('bulkDensity')
    };

    try {
        const response = await fetch('http://localhost:5000/observations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to submit');
        }

        const result = await response.json();
        alert(`Observation saved! Plant Type: ${result.parsedData.plantType}`);
        formRef.current.reset();
        onBack(); // Navigate back to Records page

    } catch (error: any) {
        console.error('Error submitting observation:', error);
        alert(`Error: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] pb-10">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-700 hover:text-[#1b6b3a] transition-colors min-h-[44px]"
            >
                <ArrowLeft size={22} />
            </button>
            <div className="flex items-center gap-3">
                {/* <img src="/terragrn-logo.png" alt="Terragrn" className="h-10 w-auto rounded-md object-contain hidden" /> */}
                <div>
                    <h1 className="text-[#1b6b3a] font-bold text-lg tracking-wide">Nature-Tech</h1>
                    <p className="text-xs text-gray-500">Field Data Capture</p>
                </div>
            </div>
        </div>
        <button 
            onClick={() => document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-[#1b6b3a] text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-lg shadow-[#1b6b3a]/20 hover:translate-y-[-1px] transition-transform"
        >
            Open Form
        </button>
      </div>

      <main className="max-w-6xl mx-auto p-5 flex flex-col lg:flex-row gap-5 items-start">
        {/* Main Panel */}
        <section className="flex-1 bg-white rounded-xl p-5 border border-gray-100 shadow-sm w-full">
            <h2 className="text-[#1b6b3a] text-lg font-bold mb-2">Field Data Capture</h2>
            <p className="text-gray-500 text-sm mb-6">Complete the form below to capture plant allometry and field observations. PDF reports and batch export are available.</p>

            <form id="form" ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                
                 {/* Identity Section - Barcode OR Manual */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Plant Identity</h3>
                    
                    {/* Option 1: Barcode */}
                    <div>
                        <label className="block text-xs font-bold text-[#1b6b3a] mb-1.5">Scan Barcode / Tag</label>
                        <div className="flex gap-2">
                            <input name="barcode" type="text" placeholder="e.g. Z1A3017032011" className="flex-1 p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                            <button type="button" className="bg-[#f2f4f3] px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2 text-gray-700">
                                <Scan size={16} /> Scan
                            </button>
                        </div>
                    </div>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-gray-50 px-2 text-gray-500 font-bold">Or enter manually</span>
                        </div>
                    </div>

                    {/* Option 2: Manual Fields */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Farm ID</label>
                            <input name="manualSiteCode" type="text" placeholder="Z1" className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Block ID</label>
                            <input name="manualBlockId" type="text" placeholder="A" className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Grid #</label>
                            <input name="manualGridNum" type="text" placeholder="30" className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Row #</label>
                            <input name="manualRowNum" type="text" placeholder="17" className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Plant #</label>
                            <input name="manualPlantNum" type="text" placeholder="032" className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Species Code</label>
                            <input name="manualSpeciesCode" type="text" placeholder="011" className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                    </div>
                     <p className="text-[10px] text-gray-400 mt-2 text-center">Enter either Barcode OR all manual fields.</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-[#123] mb-1.5">Photograph (upload or camera)</label>
                    <div className="flex gap-2 items-center">
                        <label className="flex-1 cursor-pointer">
                            <div className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm text-gray-500 flex items-center gap-2 hover:bg-gray-50">
                                <Camera size={16} />
                                <span>Choose or take photo...</span>
                            </div>
                            <input type="file" accept="image/*" capture="environment" className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { id: 'spots', label: 'Spots on leaves' },
                        { id: 'yellowLeaves', label: 'Yellow Leaves' },
                        { id: 'drooping', label: 'Drooping / dry leaves' },
                        { id: 'visiblePest', label: 'Visible pest?' },
                        { id: 'recentPestDamage', label: 'Recent pest damage?' },
                    ].map((field) => (
                        <div key={field.id}>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">{field.label}</label>
                            <select name={field.id} className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20">
                                <option value="">-- select --</option>
                                <option>Yes</option>
                                <option>No</option>
                                <option>N/A</option>
                            </select>
                        </div>
                    ))}
                    
                    <div>
                        <label className="block text-xs font-bold text-[#123] mb-1.5">Type of Pest</label>
                        <input name="typeOfPest" type="text" placeholder="e.g. aphids" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#123] mb-1.5">Diameter at base (new shoot) (cm)</label>
                        <input name="diameterAtBase" type="number" step="0.1" min="0" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                    </div>
                </div>

                {/* Plant Details */}
                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-[#1b6b3a] text-sm font-bold mb-3">Plant Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Berry Type</label>
                            <input name="berryType" type="text" placeholder="e.g. Strawberry" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Fixer Name</label>
                            <input name="fixerName" type="text" placeholder="e.g. Nitrogen Fixer" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                    </div>
                    
                    <h4 className="text-xs font-bold text-gray-500 mt-4 mb-2">Old Bamboo Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Number of Culms</label>
                            <input name="oldBambooNumberofculms" type="number" step="1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Marker Colour</label>
                            <input name="oldBambooMarkercolour" type="text" placeholder="e.g. Red" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Diameter at Base (cm)</label>
                            <input name="oldBambooDiameteratbase" type="number" step="0.1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Culm Height (m)</label>
                            <input name="oldBambooCulmheight" type="number" step="0.1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                    </div>

                    <h4 className="text-xs font-bold text-gray-500 mt-4 mb-2">New Bamboo Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">New Shoots Count</label>
                            <input name="newBambooShoots" type="number" step="1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Marker Colour</label>
                            <input name="newBambooMarkercolour" type="text" placeholder="e.g. Blue" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Shoot Height (m)</label>
                            <input name="newBambooShootheight" type="number" step="0.1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                    </div>
                </div>

                {/* Fruit Metrics */}
                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-[#1b6b3a] text-sm font-bold mb-3">Fruit Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Height (m)</label>
                            <input name="fruitHeight" type="number" step="0.1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Diameter (cm)</label>
                            <input name="fruitDiameter" type="number" step="0.1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Number of Branches</label>
                            <input name="fruitNumberofbranches" type="number" step="1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Number of Flower Clusters</label>
                            <input name="fruitNumberofflowerclusters" type="number" step="1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Number of Fruit</label>
                            <input name="fruitNumberoffruit" type="number" step="1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                    </div>
                </div>

                {/* Soil & Environment */}
                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-[#1b6b3a] text-sm font-bold mb-3">Soil & Environment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Sufficient Mulch?</label>
                            <input name="sufficientMulch" type="text" placeholder="Yes/No" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Sufficient Compost/Manure?</label>
                            <input name="sufficientCompostManure" type="text" placeholder="Yes/No" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Soil Moisture (%)</label>
                            <input name="soilMoisture" type="number" step="0.1" placeholder="e.g. 45" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Electrical Conductivity</label>
                            <input name="electricalConductivity" type="number" step="0.01" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">pH Value</label>
                            <input name="pHValue" type="number" step="0.1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Temperature (°C)</label>
                            <input name="temperature" type="number" step="0.1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Moisture/RH (%)</label>
                            <input name="moisture" type="number" step="0.1" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                    </div>
                </div>


                {/* Advanced Environmental Conditions */}
                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-[#1b6b3a] text-sm font-bold mb-3">Environmental Conditions (Advanced)</h3>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-4">
                        <p className="text-xs text-yellow-800">
                            <strong>Note:</strong> These values strictly trigger advanced alerts (Fire, Drought, Flood, Erosion). Leave blank if not measuring.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Rainfall (mm/month)</label>
                            <input name="rainfall" type="number" step="0.1" placeholder="e.g. 100" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Evapotranspiration (ET) (mm)</label>
                            <input name="et" type="number" step="0.1" placeholder="e.g. 50" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Slope Gradient</label>
                            <select name="slope" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20">
                                <option value="Flat">Flat</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Steep">Steep</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Soil Bulk Density (g/cm³)</label>
                            <input name="bulkDensity" type="number" step="0.01" placeholder="e.g. 1.4" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#123] mb-1.5">Exchangeable Sodium % (ESP)</label>
                            <input name="esp" type="number" step="0.1" placeholder="e.g. 6" className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-[#123] mb-1.5">Additional notes</label>
                    <textarea name="notes" placeholder="Anything notable..." className="w-full p-2.5 rounded-lg border border-[#e6e9e8] bg-white text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]/20"></textarea>
                </div>

                <div className="pt-8 pb-12">
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full text-white px-4 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl transition-transform active:scale-95"
                        style={{ backgroundColor: '#22c55e', boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)' }}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />} 
                        {isSubmitting ? 'Saving...' : 'SUBMIT OBSERVATION'}
                    </button>
                </div>
            </form>
        </section>
      </main>

      <footer className="text-center text-gray-500 text-xs py-6">
        © TERRAGRN – Proprietary and Confidential — styled with Terragrn design language.
      </footer>
    </div>
  );
}
