import { useState, useEffect, useMemo, ReactNode } from 'react';
import { ArrowLeft, User, TrendingUp, AlertTriangle, Brain, Droplets, BarChart3, CheckCircle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenerativeAI } from '@google/generative-ai';
import yieldData from '../data/yieldData.json';


const API_KEY = "AIzaSyCDJsiiVY2Sgx6GRaMUmxbC8EgWs587B38";

interface InsightsPageProps {
  onBack: () => void;
}

interface Insight {
  title: string;
  description: string;
  type: 'Positive Trend' | 'Alert' | 'Prediction' | 'Info';
}

interface InsightCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  tag: {
    label: string;
    color: 'green' | 'amber' | 'blue';
  };
}

function InsightCard({ icon, title, description, tag }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const tagColors = {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="relative bg-gradient-to-br from-[#F3F1E7] to-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      {/* Tag */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${tagColors[tag.color]}`}>
        {tag.label}
      </div>

      {/* Icon */}
      <div className="text-[#3FA77C] mb-3">
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-gray-800 mb-2 pr-24 font-medium text-base">{title}</h3>
      <div className="text-gray-600 text-sm">
        <p className={!isExpanded ? "line-clamp-2" : ""}>{description}</p>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-[#3FA77C] text-xs mt-1 font-medium hover:underline focus:outline-none"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      </div>
    </div>
  );
}

const { rawData } = yieldData;

export function InsightsPage({ onBack }: InsightsPageProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const dataSummary = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;

    // Sort by date
    const sortedDates = rawData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Get unique months to aggregate cumulative data correctly
    const uniqueMonths = [...new Set(rawData.map(item => item.date.substring(0, 7)))].sort();
    const lastMonth = uniqueMonths[uniqueMonths.length - 1];
    const firstMonth = uniqueMonths[0];

    // Calculate Total Cumulative Biomass for the LAST month (Current State)
    // We sum the cumulativeBiomass of all records in the last month
    const currentTotalBiomass = rawData
      .filter(item => item.date.startsWith(lastMonth))
      .reduce((sum, item) => sum + ((item as any).cumulativeBiomass || 0), 0);

    // Calculate Total Cumulative Biomass for the FIRST month (Baseline)
    const baselineTotalBiomass = rawData
      .filter(item => item.date.startsWith(firstMonth))
      .reduce((sum, item) => sum + ((item as any).cumulativeBiomass || 0), 0);

    // Group by Plant Type (using cumulative sum of the last month)
    const plantGroups: Record<string, number> = {};
    rawData.filter(item => item.date.startsWith(lastMonth)).forEach(item => {
      if (!plantGroups[item.plantType]) plantGroups[item.plantType] = 0;
      plantGroups[item.plantType] += (item as any).cumulativeBiomass || 0;
    });
    const sortedPlants = Object.entries(plantGroups).sort((a, b) => b[1] - a[1]);
    
    // Group by Block (using cumulative sum of the last month)
    const blockGroups: Record<string, number> = {};
    rawData.filter(item => item.date.startsWith(lastMonth)).forEach(item => {
      if (!blockGroups[item.block]) blockGroups[item.block] = 0;
      blockGroups[item.block] += (item as any).cumulativeBiomass || 0;
    });
    const sortedBlocks = Object.entries(blockGroups).sort((a, b) => b[1] - a[1]);

    // Growth Trend
    let growth = 0;
    if (baselineTotalBiomass > 0) {
      growth = ((currentTotalBiomass - baselineTotalBiomass) / baselineTotalBiomass) * 100;
    }

    return {
      totalRecords: rawData.length,
      currentTotalBiomass: currentTotalBiomass.toFixed(0),
      topPlant: sortedPlants[0]?.[0],
      topBlock: sortedBlocks[0]?.[0],
      growthTrend: growth.toFixed(2) + '%',
      dateRange: `${sortedDates[0].date} to ${sortedDates[sortedDates.length - 1].date}`
    };
  }, []);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!dataSummary) return;
      
      if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
        setError("Please configure your Gemini API Key in the code.");
        setLoading(false);
        return;
      }

      try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const prompt = `
          Analyze this agricultural yield data summary which tracks CUMULATIVE BIOMASS GROWTH and generate:
          1. 4 distinct, realistic insights for a dashboard.
          2. A concise 1-sentence summary of the overall farm health and a key action item.
          
          Data Summary:
          - Total Records Processed: ${dataSummary.totalRecords}
          - Current Total Cumulative Biomass: ${dataSummary.currentTotalBiomass} kg
          - Top Performing Plant (by total biomass): ${dataSummary.topPlant}
          - Top Performing Block (by total biomass): Block ${dataSummary.topBlock}
          - Overall Cumulative Growth Trend: ${dataSummary.growthTrend} (increase from start to now)
          - Date Range: ${dataSummary.dateRange}

          Output strictly as a JSON object with these keys:
          - "insights": Array of objects with keys:
            - "title": Short, punchy headline (max 40 chars)
            - "description": 1-2 sentences explaining the insight (max 120 chars)
            - "type": One of "Positive Trend", "Alert", "Prediction", "Info"
          - "summary": A single string containing the overall summary and action item.

          Make the insights sound professional and agronomy-focused. Focus on the cumulative growth aspect.
          Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up potential markdown code blocks
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(jsonString);
        
        setInsights(parsedData.insights);
        setSummary(parsedData.summary);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching insights:", err);
        setError("Failed to generate insights. Please try again.");
        setLoading(false);
      }
    };

    fetchInsights();
  }, [dataSummary]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Positive Trend': return <TrendingUp size={28} />;
      case 'Alert': return <AlertTriangle size={28} />;
      case 'Prediction': return <Brain size={28} />;
      default: return <BarChart3 size={28} />;
    }
  };

  const getTagColor = (type: string): 'green' | 'amber' | 'blue' => {
    switch (type) {
      case 'Positive Trend': return 'green';
      case 'Alert': return 'amber';
      case 'Prediction': return 'blue';
      default: return 'blue';
    }
  };

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

          <h2 className="text-[#3FA77C]">Farm Insights</h2>

          <div className="w-11" />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-5 space-y-5 max-w-2xl mx-auto">
        {/* Subtitle */}
        <p className="text-gray-400 text-center text-xs">
          AI-driven analytics and yield interpretations
        </p>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm">Analyzing yield data with Gemini AI...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Insight Cards */}
        {!loading && !error && (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                icon={getIconForType(insight.type)}
                title={insight.title}
                description={insight.description}
                tag={{ label: insight.type, color: getTagColor(insight.type) }}
              />
            ))}
          </div>
        )}

        {/* Prediction Accuracy Chart - REMOVED */}

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-[#3FA77C]/10 to-white rounded-[24px] p-5 border border-[#3FA77C]/20">
          <p className="text-sm text-gray-700">
            <span className="text-[#3FA77C]">💡 Summary:</span> {summary || "Generating summary..."}
          </p>
        </div>
      </div>
    </div>
  );
}
