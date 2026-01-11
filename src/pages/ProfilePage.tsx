import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, Loader2 } from 'lucide-react';
import { TopNavBar } from '../components/TopNavBar';

interface ProfilePageProps {
  user: any;
  onBack: () => void;
}

export function ProfilePage({ user, onBack }: ProfilePageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/profiles/${user.user_id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user?.user_id) fetchProfile();
  }, [user]);

  if (loading) {
      return (
          <div className="flex justify-center items-center h-full min-h-[400px]">
              <Loader2 className="animate-spin text-[#3FA77C]" size={32} />
          </div>
      );
  }

  if (!profile) return <div>Error loading profile.</div>;

  return (
    <div className="flex flex-col h-full bg-[#FAFAF5]">
      {/* Top Navbar is handled by App.tsx generally, but requested to have it. 
          However, App.tsx renders TopNavBar globally. 
          If I add it here, it might be double.
          User request: "make sure those pages also have the topnavbar"
          In App.tsx, TopNavBar is outside renderScreen(). So it IS already there.
          I will NOT add it here to avoid duplication. 
          Wait, Account page is rendered inside renderScreen, below the global header.
          So it will have the global header. 
      */}

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
            
            <div className="text-center">
                <div className="w-24 h-24 bg-[#3FA77C]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3FA77C]">
                    <User size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">{profile.full_name}</h1>
                <p className="text-gray-500 text-sm mt-1">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-6">
                <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-full text-gray-500">
                        <Mail size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email Address</p>
                        <p className="text-gray-800 font-medium">{profile.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-full text-gray-500">
                        <Phone size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Phone Number</p>
                        <p className="text-gray-800 font-medium">{profile.phone || 'N/A'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-full text-gray-500">
                        <Shield size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Role</p>
                        <p className="text-gray-800 font-medium capitalize">{user.role}</p>
                    </div>
                </div>
            </div>

             <div className="bg-[#3FA77C]/5 rounded-xl p-4 text-center">
                <p className="text-sm text-[#3FA77C] font-medium">Profile completeness: 100%</p>
            </div>
        </div>
      </div>
    </div>
  );
}
