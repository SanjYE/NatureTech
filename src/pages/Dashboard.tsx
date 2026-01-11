import { useState } from 'react';
import { DashboardCard } from '../components/DashboardCard';
import { YieldMetrics } from '../components/YieldMetrics';
import { InsightsPage } from '../components/InsightsPage';
import { AIRecommendations } from '../components/AIRecommendations';
import { AlertsPage } from '../components/AlertsPage';
import { MappingTool } from '../components/MappingTool';
import { TNFDMetrics } from '../components/TNFDMetrics';
import { TNFDMap } from '../components/TNFDMap';
import { TrendingUp, BarChart3, Brain, Bell, MapPin, FileCheck, ArrowLeft } from 'lucide-react';

interface DashboardProps {
  onBack: () => void;
}

export function Dashboard({ onBack }: DashboardProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'yield-metrics' | 'insights' | 'ai-recommendations' | 'alerts' | 'mapping' | 'tnfd' | 'tnfd-map'>('dashboard');

  const handleCardClick = (cardName: string) => {
    if (cardName === 'Crop Yield') {
      setCurrentView('yield-metrics');
    } else if (cardName === 'Farm Insights') {
      setCurrentView('insights');
    } else if (cardName === 'My Recommendations') {
      setCurrentView('ai-recommendations');
    } else if (cardName === 'My Alerts') {
      setCurrentView('alerts');
    } else if (cardName === 'Soil Health') {
      setCurrentView('mapping');
    } else if (cardName === 'TNFD Compliance') {
      setCurrentView('tnfd');
    }
  };

  if (currentView === 'yield-metrics') {
    return <YieldMetrics onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'insights') {
    return <InsightsPage onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'ai-recommendations') {
    return <AIRecommendations onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'alerts') {
    return <AlertsPage onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'mapping') {
    return <MappingTool onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'tnfd') {
    return <TNFDMetrics onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'tnfd-map') {
    return <TNFDMap onBack={() => setCurrentView('tnfd')} />;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Back to Main Menu Button */}
      <div className="px-6 pt-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#3FA77C] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Menu</span>
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 px-6 pt-8 pb-24 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>
          <div className="grid grid-cols-2 gap-5">
            {/* Row 1 */}
            <div className="aspect-square">
              <DashboardCard
                label="Crop Yield"
                icon={<TrendingUp size={48} strokeWidth={1.5} />}
                onClick={() => handleCardClick('Crop Yield')}
              />
            </div>
            
            <div className="aspect-square">
              <DashboardCard
                label="Farm Insights"
                icon={<BarChart3 size={48} strokeWidth={1.5} />}
                onClick={() => handleCardClick('Farm Insights')}
              />
            </div>

            {/* Row 2 */}
            <div className="aspect-square">
              <DashboardCard
                label="Soil Health"
                icon={<MapPin size={48} strokeWidth={1.5} />}
                onClick={() => handleCardClick('Soil Health')}
              />
            </div>
            
            <div className="aspect-square">
              <DashboardCard
                label="TNFD Compliance"
                icon={<FileCheck size={48} strokeWidth={1.5} />}
                onClick={() => handleCardClick('TNFD Compliance')}
              />
            </div>

            {/* Row 3 */}
            <div className="aspect-square">
              <DashboardCard
                label="My Recommendations"
                icon={<Brain size={48} strokeWidth={1.5} />}
                onClick={() => handleCardClick('My Recommendations')}
              />
            </div>
            
            <div className="aspect-square">
              <DashboardCard
                label="My Alerts"
                icon={<Bell size={48} strokeWidth={1.5} />}
                onClick={() => handleCardClick('My Alerts')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
