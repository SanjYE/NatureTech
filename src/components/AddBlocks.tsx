import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, MapPin, Loader2, Crosshair } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { API_BASE_URL } from '../config';

interface AddBlocksProps {
  siteId: string;
  siteName: string;
  onBack: () => void;
  onFinish: () => void;
}

interface Coordinate {
  lat: string;
  lng: string;
}

export function AddBlocks({ siteId, siteName, onBack, onFinish }: AddBlocksProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [blockName, setBlockName] = useState('');
  const [blockArea, setBlockArea] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinate[]>([{ lat: '', lng: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedBlocks, setAddedBlocks] = useState<any[]>([]);

  const handleAddCoordinate = () => {
    setCoordinates([...coordinates, { lat: '', lng: '' }]);
  };

  const handleGetCurrentLocation = (index: number) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoordinates = [...coordinates];
        newCoordinates[index] = {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6)
        };
        setCoordinates(newCoordinates);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please ensure location services are enabled.');
      }
    );
  };

  const handleRemoveCoordinate = (index: number) => {
    const newCoords = [...coordinates];
    newCoords.splice(index, 1);
    setCoordinates(newCoords);
  };

  const handleCoordinateChange = (index: number, field: 'lat' | 'lng', value: string) => {
    const newCoords = [...coordinates];
    newCoords[index][field] = value;
    setCoordinates(newCoords);
  };

  const handleSaveBlock = async () => {
    // Validation
    if (!blockName || !blockArea) {
      alert('Please enter block name and area');
      return;
    }

    const validCoords = coordinates.filter(c => c.lat && c.lng);
    if (validCoords.length < 3) {
      alert('Please enter at least 3 coordinates to form a polygon');
      return;
    }

    setIsSubmitting(true);

    try {
      // Construct GeoJSON Polygon
      // Coordinates must be [lng, lat]
      // Polygon must be closed (first point = last point)
      const polygonCoords = validCoords.map(c => [parseFloat(c.lng), parseFloat(c.lat)]);
      // Close the polygon
      polygonCoords.push(polygonCoords[0]);

      const geometry = {
        type: 'Polygon',
        coordinates: [polygonCoords]
      };

      const blockData = {
        siteId,
        name: blockName,
        area_ha: parseFloat(blockArea),
        geom: JSON.stringify(geometry),
        unitType: 'block' // Default type
      };

      const response = await fetch(`${API_BASE_URL}/site-units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save block');
      }

      const result = await response.json();
      
      setAddedBlocks([...addedBlocks, result.siteUnit]);
      
      // Reset form
      setBlockName('');
      setBlockArea('');
      setCoordinates([{ lat: '', lng: '' }]);
      setIsAdding(false);
      alert('Block added successfully!');

    } catch (error: any) {
      console.error('Error saving block:', error);
      alert(`Error saving block: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAF5]">
      {/* Header */}
      <div className="flex-none bg-[#FAFAF5]/95 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-600 hover:text-[#3FA77C] hover:bg-[#3FA77C]/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-gray-800">Add Blocks</h1>
            <p className="text-xs text-gray-500">{siteName}</p>
          </div>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Added Blocks List */}
          {addedBlocks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Added Blocks</h3>
              {addedBlocks.map((block, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{block.name}</p>
                    <p className="text-sm text-gray-500">{block.area_ha} ha</p>
                  </div>
                  <div className="h-8 w-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                    <MapPin size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Block Section */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-[#3FA77C]/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-[#3FA77C] hover:bg-[#3FA77C]/5 transition-colors"
            >
              <div className="h-10 w-10 bg-[#3FA77C] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#3FA77C]/20">
                <Plus size={24} />
              </div>
              <span className="font-medium">Add New Block</span>
            </button>
          ) : (
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg text-gray-800">New Block Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Block Name</label>
                    <Input 
                      value={blockName}
                      onChange={(e) => setBlockName(e.target.value)}
                      placeholder="e.g. Block A" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Area (ha)</label>
                    <Input 
                      type="number"
                      value={blockArea}
                      onChange={(e) => setBlockArea(e.target.value)}
                      placeholder="0.00" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Boundary Coordinates</label>
                    <span className="text-xs text-gray-500">Lat, Long (Decimal Degrees)</span>
                  </div>
                  
                  <div className="space-y-3">
                    {coordinates.map((coord, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <Input 
                            placeholder="Latitude" 
                            value={coord.lat}
                            onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
                          />
                          <Input 
                            placeholder="Longitude" 
                            value={coord.lng}
                            onChange={(e) => handleCoordinateChange(index, 'lng', e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => handleGetCurrentLocation(index)}
                          className="p-2 text-gray-400 hover:text-[#3FA77C] hover:bg-[#3FA77C]/10 rounded-lg transition-colors"
                          title="Use Current Location"
                        >
                          <Crosshair size={18} />
                        </button>
                        {coordinates.length > 1 && (
                          <button 
                            onClick={() => handleRemoveCoordinate(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={handleAddCoordinate}
                    className="w-full border-dashed border-gray-300 text-gray-600 hover:border-[#3FA77C] hover:text-[#3FA77C]"
                  >
                    <Plus size={16} className="mr-2" /> Add Coordinate
                  </Button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveBlock}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#3FA77C] hover:bg-[#2e8560] text-white"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                    Save Block
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Finish Button */}
          <div className="pt-8">
            <Button 
              onClick={onFinish}
              className="w-full h-12 bg-[#3FA77C] text-white hover:bg-[#2e8560] rounded-xl shadow-lg shadow-[#3FA77C]/20"
            >
              Finish & Return to Menu
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
