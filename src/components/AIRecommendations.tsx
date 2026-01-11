import { useState, useEffect } from 'react';
import { ArrowLeft, User, Leaf, FlaskConical, Droplets, Sun, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface AIRecommendationsProps {
  onBack: () => void;
}

const deviationData = [
  { week: 'W1', predicted: 100, actual: 100 },
  { week: 'W2', predicted: 108, actual: 107 },
  { week: 'W3', predicted: 115, actual: 112 },
  { week: 'W4', predicted: 123, actual: 117 },
  { week: 'W5', predicted: 130, actual: 121 },
  { week: 'W6', predicted: 138, actual: 125 },
  { week: 'W7', predicted: 145, actual: 130 },
  { week: 'W8', predicted: 152, actual: 137 },
];

interface RecommendationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}

function RecommendationCard({ icon, title, description, tag }: RecommendationCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#F0F8F5] to-white rounded-[20px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-[#3FA77C]/10">
      <div className="flex items-start gap-4">
        <div className="text-[#3FA77C] flex-shrink-0 mt-1">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-gray-800 mb-1">{title}</h4>
          {/* shortened copy */}
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          <span className="inline-block px-3 py-1 bg-[#3FA77C]/10 text-[#3FA77C] rounded-full text-xs">
            {tag}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AIRecommendations({ onBack }: AIRecommendationsProps) {
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    console.log('AIRecommendations mounted');
    const fetchRecs = async () => {
      try {
        const res = await fetch('http://localhost:5000/recommendations');
        const data = await res.json();
        // Filter out resolved recommendations to only show active suggestions
        // User request: "old recommendation is still there" -> So we hide 'resolved' ones.
        const activeData = data.filter((rec: any) => rec.status !== 'resolved');
        setRecommendations(activeData);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRecs();
  }, []);

  const currentYield = 95.5;
  const targetYield = 100;
  const yieldPercentage = (currentYield / targetYield) * 100;
  const revenueLoss = 12400;
  const lossPercentage = 4.5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF5] to-[#F3F1E7] pb-6">
      {/* Top Navigation (unchanged styling) */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-[#3FA77C] transition-colors min-h-[44px]"
          >
            <ArrowLeft size={22} />
          </button>

          <h2 className="text-[#3FA77C]">Recommendations</h2>

          <div className="w-11" />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-5 max-w-2xl mx-auto">
        {/* Tagline (shortened) */}
        <p className="text-gray-600 text-center text-sm px-4 mb-6">
          Deviation insights and quick actions
        </p>

        {/* Deviation Summary Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <h3 className="text-gray-800 mb-4">Growth Deviation</h3>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={deviationData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <defs>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3FA77C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3FA77C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="week"
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                label={{ value: 'Time', position: 'insideBottom', offset: -10, style: { fontSize: '11px', fill: '#6b7280' } }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                label={{ value: 'Biomass Growth %', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#6b7280' } }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" wrapperStyle={{ bottom: 0 }} iconType="circle" />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#3FA77C"
                strokeWidth={2.5}
                fill="url(#predictedGradient)"
                name="Predicted"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#actualGradient)"
                name="Actual"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* condensed alert */}
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3">
              <TrendingDown size={20} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Block A-02 deviation: <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium ml-1">-7.5%</span> vs ideal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Tips Section (Dropdown) */}
      <div className="px-5 max-w-2xl mx-auto my-8">
        <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden border border-[#3FA77C]/20">
          <button
            onClick={() => setIsRecommendationsOpen(!isRecommendationsOpen)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <h3 className="text-gray-800 font-medium">Operational Recommendations</h3>
            {isRecommendationsOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
          </button>
          
          {isRecommendationsOpen && (
            <div className="px-5 pb-5 space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((rec: any) => (
                  <RecommendationCard
                    key={rec.recommendation_id}
                    icon={<FlaskConical size={24} />}
                    title={rec.title}
                    description={rec.body}
                    tag={rec.priority + ' Priority'}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No active recommendations.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Implications (concise labels) */}
      

      {/* Action Summary (Full Width Band) */}
      <div className="bg-gradient-to-br from-[#3FA77C] to-[#2d8a63] p-6 shadow-lg text-white">
        <h4 className="mb-3 font-medium">Next Steps</h4>
        <ul className="space-y-3 text-sm">
          {recommendations.length > 0 ? (
            recommendations.map((rec: any) => (
              <li key={rec.recommendation_id} className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 rounded border-white/40 bg-white/10 text-[#3FA77C] focus:ring-offset-0 focus:ring-0 cursor-pointer" />
                <span>{rec.title}</span>
              </li>
            ))
          ) : (
            <li className="flex items-center gap-3">
              <span>No immediate actions required.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
