import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Loader2, User, Building2, MapPin, Briefcase, Phone, ArrowRight, ChevronDown } from 'lucide-react';

interface CompleteProfileProps {
  userId: string;
  onComplete: (user: any) => void;
}

export function CompleteProfile({ userId, onComplete }: CompleteProfileProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    orgName: '',
    orgType: '',
    country: '',
    role: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete profile');
      }

      onComplete({ 
        ...data.user, 
        organisationId: data.organisationId,
        role: formData.role 
      });
    } catch (err: any) {
      console.error("Profile Completion Error:", err);
      setError(err.message || 'Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FAFAF5] to-[#E8E8E0] p-6 relative">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#3FA77C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#C7A66B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <div className="flex flex-col items-center justify-center mb-8 gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/image1.png" 
              alt="TERRAGRN" 
              className="w-auto object-contain h-12" 
            />
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#1b775bff' }}>
              Nature-Tech
            </span>
          </div>
          <p className="text-gray-500 text-lg mt-2">Complete your profile to continue</p>
        </div>

        <Card className="border-none shadow-[0_8px_40px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl rounded-[32px]">
          <CardHeader className="pb-0 pt-8 px-8">
            <CardTitle className="text-xl font-semibold text-[#1b775b]">Personal & Organisation Details</CardTitle>
            <CardDescription>Please provide your details to set up your workspace.</CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Personal Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 ml-1">
                      <User size={16} className="text-[#3FA77C]" />
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                    </div>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      required
                      className="bg-white/50 border-gray-200 h-12 pl-4 rounded-xl focus:ring-[#3FA77C] focus:border-[#3FA77C]"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 ml-1">
                      <User size={16} className="text-[#3FA77C]" />
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                    </div>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      required
                      className="bg-white/50 border-gray-200 h-12 pl-4 rounded-xl focus:ring-[#3FA77C] focus:border-[#3FA77C]"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <Phone size={16} className="text-[#3FA77C]" />
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  </div>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                    className="bg-white/50 border-gray-200 h-12 pl-4 rounded-xl focus:ring-[#3FA77C] focus:border-[#3FA77C]"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="h-px bg-gray-200" />

              {/* Organisation Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Organisation Details</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <Building2 size={16} className="text-[#3FA77C]" />
                    <label className="text-sm font-medium text-gray-700">Organisation Name</label>
                  </div>
                  <Input
                    value={formData.orgName}
                    onChange={(e) => handleChange('orgName', e.target.value)}
                    required
                    className="bg-white/50 border-gray-200 h-12 pl-4 rounded-xl focus:ring-[#3FA77C] focus:border-[#3FA77C]"
                    placeholder="e.g. Green Valley Farms"
                  />
                  <p className="text-xs text-gray-500 ml-1">If this Organisation already exists, you will be added to it.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <Briefcase size={16} className="text-[#3FA77C]" />
                    <label className="text-sm font-medium text-gray-700">Nature of Organisation</label>
                  </div>
                  <Input
                    value={formData.orgType}
                    onChange={(e) => handleChange('orgType', e.target.value)}
                    required
                    className="bg-white/50 border-gray-200 h-12 pl-4 rounded-xl focus:ring-[#3FA77C] focus:border-[#3FA77C]"
                    placeholder="e.g. SME, Project Developer, Insurer, Corporate..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <User size={16} className="text-[#3FA77C]" />
                    <label className="text-sm font-medium text-gray-700">Your Role</label>
                  </div>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      required
                      className="w-full bg-white/50 border border-gray-200 h-10 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3FA77C] focus:border-[#3FA77C] appearance-none"
                    >
                      <option value="" disabled>Select Role</option>
                      <option value="Manager">Manager</option>
                      <option value="Farmer">Farmer</option>
                      <option value="Owner">Owner</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <MapPin size={16} className="text-[#3FA77C]" />
                    <label className="text-sm font-medium text-gray-700">Country</label>
                  </div>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    required
                    className="bg-white/50 border-gray-200 h-12 pl-4 rounded-xl focus:ring-[#3FA77C] focus:border-[#3FA77C]"
                    placeholder="United States"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#3FA77C] hover:bg-[#2e8560] h-12 rounded-xl text-base font-medium shadow-[0_4px_14px_rgba(63,167,124,0.3)] hover:shadow-[0_6px_20px_rgba(63,167,124,0.4)] transition-all duration-300 mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving details...
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Complete Profile <ArrowRight size={18} />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
