import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Users, MapPin, Globe, Loader2, Award } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface MyOrganisationPageProps {
  user: any;
  onBack: () => void;
}

export function MyOrganisationPage({ user, onBack }: MyOrganisationPageProps) {
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        if (!user.organisationId) return;

        const orgRes = await fetch(`${API_BASE_URL}/organisations/${user.organisationId}`);
        if (orgRes.ok) {
           const orgData = await orgRes.json();
           setOrg(orgData);
        }

        const memRes = await fetch(`${API_BASE_URL}/organisation/${user.organisationId}/members`);
        if (memRes.ok) {
           const memData = await memRes.json();
           setMembers(memData);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgData();
  }, [user]);

  if (loading) {
      return (
          <div className="flex justify-center items-center h-full min-h-[400px]">
              <Loader2 className="animate-spin text-[#3FA77C]" size={32} />
          </div>
      );
  }

  if (!org) return (
    <div className="p-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-4 text-gray-600"><ArrowLeft size={20} /> Back</button>
        <div>No organisation found. Please complete your profile.</div>
    </div>
  );

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
            
            {/* Org Header */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-t-4 border-[#3FA77C]">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-[#3FA77C]/10 rounded-2xl flex items-center justify-center text-[#3FA77C]">
                        <Building2 size={32} />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">{org.name}</h1>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                    <span className="capitalize">{org.org_type}</span> • <span className="uppercase">{org.country_code}</span>
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Members</p>
                    <p className="text-2xl font-bold text-gray-800">{members.length}</p>
                 </div>
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Plan</p>
                    <p className="text-lg font-bold text-[#3FA77C]">Standard</p>
                 </div>
            </div>

            {/* Members List */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={20} className="text-[#3FA77C]"/> Team Members
                </h3>
                <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
                    {members.map((mem, i) => (
                        <div key={mem.user_id} className={`p-4 flex items-center justify-between ${i !== members.length -1 ? 'border-b border-gray-50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-medium">
                                    {mem.full_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{mem.full_name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{mem.role}</p>
                                </div>
                            </div>
                            {mem.role === 'admin' && <Award size={16} className="text-amber-500" />}
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
