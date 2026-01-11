import { useState, useEffect } from 'react';
import { ArrowLeft, User, AlertTriangle, CloudRain, Droplets, Flame, CheckCircle, Filter, Wind } from 'lucide-react';

interface AlertsPageProps {
  onBack: () => void;
}

interface AlertCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'critical' | 'warning' | 'resolved';
  timestamp: string;
  onAcknowledge?: () => void;
}

function AlertCard({ icon, title, description, status, timestamp, onAcknowledge }: AlertCardProps) {
  const statusConfig = {
    critical: {
      color: 'bg-red-100 text-red-700 border-red-200',
      iconColor: 'text-red-500',
      label: 'Critical',
    },
    warning: {
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      iconColor: 'text-amber-500',
      label: 'Warning',
    },
    resolved: {
      color: 'bg-green-100 text-green-700 border-green-200',
      iconColor: 'text-green-500',
      label: 'Resolved',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`bg-white rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border ${config.color.split(' ')[2]}`}>
      <div className="flex items-start gap-3">
        <div className={`${config.iconColor} flex-shrink-0 mt-1`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-gray-800 flex-1">{title}</h4>
            <span className={`px-2.5 py-1 rounded-full text-xs flex-shrink-0 ${config.color}`}>
              {config.label}
            </span>
          </div>

          {/* shortened description */}
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          <p className="text-xs text-gray-500">{timestamp}</p>

          {status !== 'resolved' && (
            <button
              onClick={onAcknowledge}
              className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors"
            >
              {status === 'critical' ? 'Acknowledge' : 'Resolve'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertsPage({ onBack }: AlertsPageProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);

  const categoryOptions = ['Fire', 'Water', 'Pest'];
  const statusOptions = ['Critical', 'Warning', 'Resolved'];

  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('http://localhost:5000/alerts');
        const data = await res.json();
        
        const formatted = data.map((a: any) => {
          // Categorize based on alert_type
          let cat = 'General';
          if (a.alert_type.includes('Fire')) cat = 'Fire';
          else if (a.alert_type.includes('Drought') || a.alert_type.includes('Flood') || a.alert_type.includes('Water')) cat = 'Water';
          else if (a.alert_type.includes('Pest')) cat = 'Pest';

          return {
            id: a.alert_id,
            section: new Date(a.created_at).toDateString() === new Date().toDateString() ? 'Today' : 'Earlier',
            icon: getIconForType(a.alert_type),
            title: a.alert_type,
            description: a.message,
            status: a.status === 'resolved' ? 'resolved' : (a.severity === 'High' ? 'critical' : 'warning'),
            timestamp: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            category: cat
          };
        });
        setAlertsData(formatted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const getIconForType = (type: string) => {
    if (type.includes('Fire')) return <Flame size={24} />;
    if (type.includes('Drought') || type.includes('Water')) return <Droplets size={24} />;
    if (type.includes('Flood') || type.includes('Rain')) return <CloudRain size={24} />;
    return <AlertTriangle size={24} />;
  };

  const toggleCategoryFilter = (filter: string) => {
    setActiveCategoryFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const toggleStatusFilter = (filter: string) => {
    setActiveStatusFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const filteredAlerts = alertsData.filter(alert => {
    const categoryMatch = activeCategoryFilters.length === 0 || activeCategoryFilters.includes(alert.category);
    // Map internal status to display status for filtering
    const displayStatus = alert.status.charAt(0).toUpperCase() + alert.status.slice(1);
    const statusMatch = activeStatusFilters.length === 0 || activeStatusFilters.includes(displayStatus);
    return categoryMatch && statusMatch;
  });

  const groupedAlerts = {
    Today: filteredAlerts.filter(a => a.section === 'Today'),
    'This Week': filteredAlerts.filter(a => a.section === 'This Week'),
    Older: filteredAlerts.filter(a => a.section === 'Older')
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

          <h2 className="text-[#3FA77C]">Alerts</h2>

          <div className="w-11" />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-5 space-y-5 max-w-2xl mx-auto">
        {/* Subtitle (shortened) */}
        <p className="text-gray-600 text-center text-sm">
          Risk and anomaly notifications
        </p>

        {/* Filters Section */}
        <div className="bg-white/90 rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full px-5 py-4 min-h-[56px]"
          >
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-[#3FA77C]" />
              <span className="text-gray-800">
                Filter Alerts <span className="text-gray-400 font-normal text-xs ml-1">(Status, Category...)</span>
              </span>
            </div>
            <span className="text-gray-600 text-sm">{showFilters ? '▲' : '▼'}</span>
          </button>

          {showFilters && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 mb-2">Status</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {statusOptions.map((status) => (
                   <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      activeStatusFilters.includes(status)
                        ? 'bg-[#3FA77C] text-white border-[#3FA77C]'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                   >
                     {status}
                   </button>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => toggleCategoryFilter(filter)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${activeCategoryFilters.includes(filter)
                        ? 'bg-[#3FA77C] text-white shadow-md'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Today Section */}
        {groupedAlerts.Today.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-gray-800 px-1 font-medium">Today</h3>
            {groupedAlerts.Today.map(alert => (
              <AlertCard
                key={alert.id}
                icon={alert.icon}
                title={alert.title}
                description={alert.description}
                status={alert.status}
                timestamp={alert.timestamp}
              />
            ))}
          </div>
        )}

        {/* This Week Section */}
        {groupedAlerts['This Week'].length > 0 && (
          <div className="space-y-3">
            <h3 className="text-gray-800 px-1">This Week</h3>
            {groupedAlerts['This Week'].map(alert => (
              <AlertCard
                key={alert.id}
                icon={alert.icon}
                title={alert.title}
                description={alert.description}
                status={alert.status}
                timestamp={alert.timestamp}
              />
            ))}
          </div>
        )}

        {/* Older Section */}
        {groupedAlerts.Older.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-gray-800 px-1">Older</h3>
            {groupedAlerts.Older.map(alert => (
              <AlertCard
                key={alert.id}
                icon={alert.icon}
                title={alert.title}
                description={alert.description}
                status={alert.status}
                timestamp={alert.timestamp}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredAlerts.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p>No alerts match your filters.</p>
            <button 
              onClick={() => { setActiveCategoryFilters([]); setActiveStatusFilters([]); }}
              className="text-[#3FA77C] text-sm mt-2 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Summary Card (concise) */}
        <div className="bg-gradient-to-br from-[#3FA77C]/10 to-white rounded-[20px] p-5 border border-[#3FA77C]/20">
          <p className="text-sm text-gray-700">
            <span className="text-[#3FA77C]">📊 Summary:</span> {filteredAlerts.filter(a => a.status === 'critical').length} critical, {filteredAlerts.filter(a => a.status === 'warning').length} warnings, {filteredAlerts.filter(a => a.status === 'resolved').length} resolved.
          </p>
        </div>
      </div>
    </div>
  );
}
