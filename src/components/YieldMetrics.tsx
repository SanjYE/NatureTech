import { useState, useMemo, ChangeEvent } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Filter, LineChart, BarChart } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import yieldData from '../data/yieldData.json';

interface YieldMetricsProps {
  onBack: () => void;
}

// Use real data from JSON
const { rawData } = yieldData;

export function YieldMetrics({ onBack }: YieldMetricsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    biomass: true,
    distribution: false,
    raw: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [showFilters, setShowFilters] = useState(false);
  // const [showCarbon, setShowCarbon] = useState(false); // Removed toggle, defaulting to Carbon view logic where applicable

  // Filter States
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [plantTypeInput, setPlantTypeInput] = useState('');
  const [blockInput, setBlockInput] = useState('');

  // Filter Logic
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const itemDate = new Date(item.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const dateMatch = itemDate >= start && itemDate <= end;
      
      // Plant Type Filter (Case Insensitive, Comma Separated)
      let plantMatch = true;
      if (plantTypeInput.trim()) {
        const searchTerms = plantTypeInput.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        if (searchTerms.length > 0) {
           // Check if any of the search terms are contained in the plant type
           plantMatch = searchTerms.some(term => item.plantType.toLowerCase().includes(term));
        }
      }

      // Block Filter (Comma Separated)
      let blockMatch = true;
      if (blockInput.trim()) {
        const searchBlocks = blockInput.split(',').map(s => s.trim()).filter(s => s);
        if (searchBlocks.length > 0) {
          blockMatch = searchBlocks.includes(item.block.toString());
        }
      }

      return dateMatch && plantMatch && blockMatch;
    });
  }, [startDate, endDate, plantTypeInput, blockInput]);

  // Aggregation Logic
  const { biomassData, distributionData, metrics, tableData } = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        biomassData: [],
        distributionData: [],
        metrics: { totalBiomass: 0, avgBiomass: 0, recordsCount: 0, overallGrowth: 0 },
        tableData: []
      };
    }

    // 1. Biomass Trend (Monthly)
    const monthlyGroups: Record<string, { sum: number; count: number; date: Date }> = {};
    
    filteredData.forEach(item => {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      
      if (!monthlyGroups[key]) {
        monthlyGroups[key] = { sum: 0, count: 0, date };
      }
      monthlyGroups[key].sum += (item as any).cumulativeBiomass || 0;
      monthlyGroups[key].count += 1;
    });

    const sortedKeys = Object.keys(monthlyGroups).sort();
    const biomassData = sortedKeys.map(key => {
      const group = monthlyGroups[key];
      // Use SUM now that we have forward-filled data for every plant in every month
      const totalBiomass = group.sum;
      
      // Carbon Calculation: ((Cumulative) * 0.47 * 3.667) / 1000
      const totalCarbon = (totalBiomass * 0.47 * 3.667) / 1000;

      return {
        month: group.date.toLocaleString('default', { month: 'short' }), // Jan, Feb
        fullDate: key,
        biomass: parseFloat(totalBiomass.toFixed(2)),
        carbon: parseFloat(totalCarbon.toFixed(2))
      };
    });



    // 3. Distribution
    const plantGroups: Record<string, { sum: number; count: number }> = {};
    filteredData.forEach(item => {
      if (!plantGroups[item.plantType]) {
        plantGroups[item.plantType] = { sum: 0, count: 0 };
      }
      plantGroups[item.plantType].sum += item.biomass;
      plantGroups[item.plantType].count += 1;
    });

    const distributionData = Object.keys(plantGroups).map(plant => ({
      name: plant,
      value: parseFloat((plantGroups[plant].sum / plantGroups[plant].count).toFixed(2))
    })).sort((a, b) => b.value - a.value);

    // 4. Metrics
    const totalBiomass = filteredData.reduce((sum, item) => sum + item.biomass, 0);
    const avgBiomass = totalBiomass / filteredData.length;
    
    // Calculate Total Carbon Sequestered (using the latest cumulative sum)
    // We use the last data point from the trend graph which represents the total cumulative biomass at the latest date
    const latestTrendData = biomassData[biomassData.length - 1];
    const totalCarbonSequestered = latestTrendData ? latestTrendData.carbon : 0;

    let overallGrowth = 0;
    if (biomassData.length > 0) {
      // Always use Carbon for overall growth
      const first = biomassData[0].carbon;
      const last = biomassData[biomassData.length - 1].carbon;
      if (first > 0) {
        overallGrowth = ((last - first) / first) * 100;
      }
    }

    const metrics = {
      totalBiomass: parseFloat(totalBiomass.toFixed(0)),
      avgBiomass: parseFloat(avgBiomass.toFixed(2)),
      recordsCount: filteredData.length,
      overallGrowth: parseFloat(overallGrowth.toFixed(2)),
      totalCarbonSequestered: parseFloat(totalCarbonSequestered.toFixed(2))
    };

    // 5. Table Data (Top 50)
    const tableData = filteredData
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50)
      .map(item => ({
        date: item.date,
        block: `Block ${item.block}`,
        plant: item.plantType,
        row: item.row,
        perHa: item.biomass,
        total: parseFloat((item.biomass * 4).toFixed(2)) // Mock total logic
      }));

    return { biomassData, distributionData, metrics, tableData };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF5] to-[#F3F1E7] pb-6">
      {/* Top Navigation */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-[#3FA77C] transition-colors min-h-[44px]"
          >
            <ArrowLeft size={22} />
          </button>

          <h2 className="text-[#3FA77C]">Crop Yield</h2>

          <div className="w-11" /> {/* Spacer to balance the header */}
        </div>
      </div>

      {/* Main Content - Single Column */}
      <div className="px-5 pt-5 flex flex-col gap-10 pb-24">
        
        {/* Filters Section - Collapsible */}
        <div className="bg-white/90 rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full px-5 py-4 min-h-[56px]"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter size={20} className="text-[#3FA77C]" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></div>
              </div>
              <h3 className="text-gray-800 text-sm font-medium">
                Filters <span className="text-gray-400 font-normal text-xs ml-1">(Date, Plant Type...)</span>
              </h3>
            </div>
            {showFilters ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
          </button>

          {showFilters && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
              {/* Date Range */}
              <div>
                <label className="text-xs text-gray-600 block mb-2">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/30"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/30"
                  />
                </div>
              </div>

              {/* Plant Type */}
              <div>
                <label className="text-xs text-gray-600 block mb-2">Plant Type (comma separated)</label>
                <input
                  type="text"
                  value={plantTypeInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPlantTypeInput(e.target.value)}
                  placeholder="e.g. TC Balcooa, Bambusa"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/30"
                />
              </div>

              {/* Block Number */}
              <div>
                <label className="text-xs text-gray-600 block mb-2">Block Number (comma separated)</label>
                <input
                  type="text"
                  value={blockInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBlockInput(e.target.value)}
                  placeholder="e.g. 1, 2, 5"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/30"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-3 bg-[#3FA77C] text-white rounded-xl hover:bg-[#358a68] transition-colors min-h-[48px]"
                >
                  Apply Filters
                </button>
                <button 
                  onClick={() => {
                    setStartDate('2023-01-01');
                    setEndDate('2024-12-31');
                    setPlantTypeInput('');
                    setBlockInput('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors min-h-[48px]"
                >
                  Reset
                </button>
              </div>

              {/* Dataset Summary */}
              <div className="p-4 bg-gradient-to-br from-[#F3F1E7] to-[#e8e6db] rounded-xl">
                <p className="text-xs text-gray-700">
                  📊 <span>{metrics.recordsCount.toLocaleString()} records</span>
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  {startDate} – {endDate}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  {plantTypeInput ? plantTypeInput : 'All plant types'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics - Horizontal Scroll */}
        <div className="overflow-x-auto -mx-5 px-5">
          <div className="flex gap-3 pb-2">
            <div className="bg-gradient-to-br from-[#f0f8f5] to-white rounded-[20px] p-5 shadow-sm min-w-[160px] flex-shrink-0">
              <p className="text-xs text-gray-600 mb-1">Total Biomass (kg)</p>
              <p className="text-gray-900 text-lg font-semibold">{metrics.totalBiomass.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-[#f0f8f5] to-white rounded-[20px] p-5 shadow-sm min-w-[160px] flex-shrink-0">
              <p className="text-xs text-gray-600 mb-1">Average Biomass (kg/ha)</p>
              <p className="text-gray-900 text-lg font-semibold">{metrics.avgBiomass.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-[#f0f8f5] to-white rounded-[20px] p-5 shadow-sm min-w-[160px] flex-shrink-0">
              <p className="text-xs text-gray-600 mb-1">Records Count (entries)</p>
              <p className="text-gray-900 text-lg font-semibold">{metrics.recordsCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Biomass/Carbon Trend Chart */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300">
          <button 
            onClick={() => toggleSection('biomass')}
            className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${expandedSections.biomass ? 'bg-[#3FA77C]/10 text-[#3FA77C]' : 'bg-gray-100 text-gray-500'}`}>
                <LineChart size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-800">Carbon Sequestration</h3>
                <p className="text-sm text-gray-500">Monthly accumulation over time</p>
              </div>
            </div>
            {expandedSections.biomass ? <ChevronUp size={24} className="text-gray-400" /> : <ChevronDown size={24} className="text-gray-400" />}
          </button>
          
          {expandedSections.biomass && (
            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={biomassData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="carbon" 
                    stroke="#3FA77C" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#3FA77C', r: 4, strokeWidth: 0 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                    name="Carbon (tCO2e)" 
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Total carbon sequestered over time
              </p>
            </div>
          )}
        </div>



        {/* Distribution Chart */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300">
          <button 
            onClick={() => toggleSection('distribution')}
            className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${expandedSections.distribution ? 'bg-[#3FA77C]/10 text-[#3FA77C]' : 'bg-gray-100 text-gray-500'}`}>
                <BarChart size={24} className="rotate-90" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-800">Plant Distribution</h3>
                <p className="text-sm text-gray-500">Average biomass by type</p>
              </div>
            </div>
            {expandedSections.distribution ? <ChevronUp size={24} className="text-gray-400" /> : <ChevronDown size={24} className="text-gray-400" />}
          </button>

          {expandedSections.distribution && (
            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '9px' }} interval={0} angle={-45} textAnchor="end" height={60} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="value" name="Biomass (kg/ha)" fill="#3FA77C" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Raw Data Table */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection('raw')}
            className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${expandedSections.raw ? 'bg-[#3FA77C]/10 text-[#3FA77C]' : 'bg-gray-100 text-gray-500'}`}>
                <Filter size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-800">Raw Data</h3>
                <p className="text-sm text-gray-500">View detailed records</p>
              </div>
            </div>
            {expandedSections.raw ? <ChevronUp size={24} className="text-gray-400" /> : <ChevronDown size={24} className="text-gray-400" />}
          </button>

          {expandedSections.raw && (
            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-2 text-gray-700">Date</th>
                      <th className="text-left py-3 px-2 text-gray-700">Block</th>
                      <th className="text-left py-3 px-2 text-gray-700">Plant</th>
                      <th className="text-left py-3 px-2 text-gray-700">Row</th>
                      <th className="text-left py-3 px-2 text-gray-700">Per Ha</th>
                      <th className="text-left py-3 px-2 text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="py-3 px-2 text-gray-700">{row.date}</td>
                        <td className="py-3 px-2 text-gray-700">{row.block}</td>
                        <td className="py-3 px-2 text-gray-700">{row.plant}</td>
                        <td className="py-3 px-2 text-gray-700">{row.row}</td>
                        <td className="py-3 px-2 text-gray-700">{row.perHa}</td>
                        <td className="py-3 px-2 text-gray-700">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}