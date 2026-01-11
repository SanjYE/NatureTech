import { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, Plus, CheckCircle, XCircle, Power, Loader2, Calendar, Hash, Server } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface ConnectedDevicesPageProps {
  user: any;
  onBack: () => void;
}

export function ConnectedDevicesPage({ user, onBack }: ConnectedDevicesPageProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    sensorType: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    installedAt: new Date().toISOString().split('T')[0]
  });

  const fetchDevices = async () => {
    try {
      if (!user.organisationId) return;
      const res = await fetch(`${API_BASE_URL}/sensors?organisationId=${user.organisationId}`);
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.organisationId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            organisationId: user.organisationId,
            siteId: null // Optional, could add a dropdown later
        })
      });

      if (res.ok) {
        alert('Device added successfully');
        setFormData({
            sensorType: '',
            manufacturer: '',
            model: '',
            serialNumber: '',
            installedAt: new Date().toISOString().split('T')[0]
        });
        fetchDevices(); // Refresh list
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to add device');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (device: any) => {
    const newStatus = device.status === 'active' ? 'inactive' : 'active';
    try {
        const res = await fetch(`${API_BASE_URL}/sensors/${device.sensor_id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (res.ok) {
            // Optimistic update
            setDevices(prev => prev.map(d => 
                d.sensor_id === device.sensor_id ? { ...d, status: newStatus } : d
            ));
        }
    } catch(e) {
        console.error(e);
    }
  };

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
        <div className="max-w-md mx-auto space-y-8 mt-4">
            
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Connected Devices</h1>
                <p className="text-gray-500 text-sm mt-1">Manage sensors and IoT hardware.</p>
            </header>

            {/* List Section */}
            <div className="space-y-4">
                <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                    <Wifi size={20} className="text-[#3FA77C]" /> 
                    Your Devices ({devices.length})
                </h3>
                
                {devices.length === 0 ? (
                    <div className="p-8 bg-white rounded-2xl border border-dashed border-gray-300 text-center">
                        <Server size={32} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No devices connected yet.</p>
                    </div>
                ) : (
                    devices.map((device) => (
                        <div key={device.sensor_id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-800">{device.sensor_type}</h4>
                                    <p className="text-xs text-gray-500">{device.manufacturer} {device.model}</p>
                                </div>
                                <button 
                                    onClick={() => toggleStatus(device)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                        device.status === 'active' 
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Power size={14} />
                                    {device.status === 'active' ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50 text-xs">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Hash size={14} className="text-gray-400" />
                                    <span className="truncate" title={device.serial_number}>S/N: {device.serial_number}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>{new Date(device.installed_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Device Section */}
            <div className="pt-8">
                <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-[#3FA77C]" /> 
                    Add New Device
                </h3>
                
                <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <form onSubmit={handleAddDevice} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Sensor Type</label>
                            <input 
                                required
                                name="sensorType"
                                value={formData.sensorType}
                                onChange={handleInputChange}
                                placeholder="e.g. Soil Moisture Sensor" 
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/20 focus:bg-white transition-all" 
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Manufacturer</label>
                                <input 
                                    required
                                    name="manufacturer"
                                    value={formData.manufacturer}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Acme Corp" 
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/20 focus:bg-white transition-all" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Model</label>
                                <input 
                                    required
                                    name="model"
                                    value={formData.model}
                                    onChange={handleInputChange}
                                    placeholder="e.g. X-2000" 
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/20 focus:bg-white transition-all" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Serial Number</label>
                            <input 
                                required
                                name="serialNumber"
                                value={formData.serialNumber}
                                onChange={handleInputChange}
                                placeholder="Enter unique S/N" 
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/20 focus:bg-white transition-all" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Date of Installation</label>
                            <input 
                                type="date"
                                required
                                name="installedAt"
                                value={formData.installedAt}
                                onChange={handleInputChange}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#3FA77C]/20 focus:bg-white transition-all" 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full mt-2 bg-[#3FA77C] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#2e8560] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            Register Device
                        </button>
                    </form>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
