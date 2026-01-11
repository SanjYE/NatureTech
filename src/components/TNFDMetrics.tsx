import { useState, useEffect, ReactNode } from 'react';
import { ArrowLeft, User, Leaf, Droplets, Sprout, FlaskConical, CheckCircle, AlertCircle, ChevronDown, ChevronUp, FileText, Upload, Download, Map } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface TNFDMetricsProps {
  onBack: () => void;
}

interface MetricCardProps {
  icon: ReactNode;
  name: string;
  value: string;
  unit: string;
  qaStatus: 'pass' | 'review' | 'fail';
}

function MetricCard({ icon, name, value, unit, qaStatus }: MetricCardProps) {
  const statusConfig = {
    pass: { label: 'Pass', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
    review: { label: 'Review', color: 'bg-amber-100 text-amber-700', icon: <AlertCircle size={14} /> },
    fail: { label: 'Fail', color: 'bg-red-100 text-red-700', icon: <AlertCircle size={14} /> },
  };

  const status = statusConfig[qaStatus];

  return (
    <div className="bg-gradient-to-br from-[#F9FAF8] to-white rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[#3FA77C]">
          {icon}
        </div>
        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}>
          {status.icon}
          <span>{status.label}</span>
        </span>
      </div>
      <h4 className="text-gray-800 mb-1 text-sm">{name}</h4>
      <div className="flex items-end gap-1">
        <p className="text-gray-900 text-2xl leading-none">{value}</p>
        <p className="text-gray-500 text-xs mb-0.5">{unit}</p>
      </div>
    </div>
  );
}

interface TargetProgressProps {
  metricName: string;
  current: number;
  target: number;
  targetYear: string;
}

function TargetProgress({ metricName, current, target, targetYear }: TargetProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-gray-800 text-sm">{metricName}</h4>
        <span className="text-xs text-gray-600">{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-[#3FA77C] to-[#2d8a63] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Baseline: {(target * 0.7).toFixed(1)}</span>
        <span className="text-[#C7A66B]">Target: {targetYear}</span>
        <span>Goal: {target}</span>
      </div>
    </div>
  );
}

export function TNFDMetrics({ onBack }: TNFDMetricsProps) {
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tnfd-metrics`);
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((m: any) => ({
            metric: m.metric_name,
            value: m.value,
            unit: m.unit,
            method: m.method,
            uncertainty: m.uncertainty,
            qa: m.qa_status,
            provenance: m.provenance
          }));
          setMetricsData(formatted);
        }
      } catch (e) {
        console.error("Error fetching TNFD metrics:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const displayData = metricsData.length > 0 ? metricsData : [
    { metric: 'Soil Organic Carbon (SOC)', value: '34.5', unit: 'tC/ha', method: 'Non-destructive v1.0', uncertainty: '±1.2', qa: 'pass', provenance: 'Lab #4532' },
    { metric: 'Water Withdrawal', value: '1250', unit: 'm³', method: 'Meter Reading', uncertainty: '±5%', qa: 'review', provenance: 'Sensor 11A' },
    { metric: 'Restoration Area', value: '12.8', unit: 'ha', method: 'Satellite Imagery', uncertainty: '±0.3', qa: 'pass', provenance: 'GIS-2024-Q4' },
    { metric: 'Pesticide Intensity', value: '2.3', unit: 'kg/ha', method: 'Purchase Records', uncertainty: '±0.1', qa: 'pass', provenance: 'Inventory #892' },
  ];

  const getIcon = (name: string) => {
    if (name.includes('Soil') || name.includes('Carbon')) return <Leaf size={20} />;
    if (name.includes('Water')) return <Droplets size={20} />;
    if (name.includes('Restoration') || name.includes('Area')) return <Sprout size={20} />;
    if (name.includes('Pesticide')) return <FlaskConical size={20} />;
    return <FileText size={20} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF5] to-[#F3F1E7] pb-10">
      {/* Top Navigation */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-[#3FA77C] transition-colors min-h-[44px]"
          >
            <ArrowLeft size={22} />
          </button>

          <h2 className="text-[#3FA77C]">TNFD Metrics</h2>

          <div className="w-11" />
        </div>
      </div>

      {/* Compliance Summary - Full Width Band */}
      <div className="bg-gradient-to-br from-[#3FA77C] to-[#2d8a63] p-6 shadow-lg text-white">
        <h4 className="mb-4">Overall Compliance</h4>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm">Disclosure Readiness</span>
          <span className="text-lg">87%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5 mb-4">
          <div className="bg-white h-2.5 rounded-full" style={{ width: '87%' }} />
        </div>
        <p className="text-sm text-white/90 mb-2">
          3/4 metrics verified • 1 under review • Q4 2025 ready
        </p>
        <button className="text-xs text-white/80 hover:text-white underline">Learn more</button>
      </div>

      {/* Metrics Grid */}
      <div className="px-5 mt-6 grid grid-cols-2 gap-4">
        {displayData.map((m, i) => (
            <MetricCard 
                key={i}
                icon={getIcon(m.metric)}
                name={m.metric}
                value={m.value}
                unit={m.unit}
                qaStatus={m.qa as any}
            />
        ))}
      </div>

      {/* Detailed Table */}
      <div className="px-5 mt-8 mb-8">
        <h3 className="text-gray-800 font-semibold mb-4">Detailed Metrics</h3>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                        <tr>
                            <th className="px-4 py-3">Metric</th>
                            <th className="px-4 py-3">Value</th>
                            <th className="px-4 py-3">Method</th>
                            <th className="px-4 py-3">QA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayData.map((row, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3 font-medium text-gray-800">{row.metric}</td>
                                <td className="px-4 py-3 text-gray-600">{row.value} {row.unit}</td>
                                <td className="px-4 py-3 text-gray-500">{row.method}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        row.qa === 'pass' ? 'bg-green-100 text-green-700' : 
                                        row.qa === 'fail' ? 'bg-red-100 text-red-700' : 
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {row.qa}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Embedded Map */}
      <div className="w-full mt-0 bg-gray-100 shadow-inner" style={{ height: '750px' }}>
        <iframe 
          src="/maps/TNFD_interactive_map_composite_TNFD_tooltips_v6.html" 
          className="w-full h-full border-none"
          title="TNFD Map View"
        />
      </div>
    </div>
  );
}