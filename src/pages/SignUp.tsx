import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Mail, Lock, ArrowRight, UserPlus } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface SignUpProps {
  onNavigateToLogin: () => void;
}

export function SignUp({ onNavigateToLogin }: SignUpProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response body:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      // Success
      setLoading(false);
      onNavigateToLogin();
    } catch (err: any) {
      console.error("Sign Up Error:", err);
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FAFAF5] to-[#E8E8E0] p-6 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#3FA77C]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#C7A66B]/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center justify-center mb-8 gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/image1.png" 
              alt="TERRAGRN" 
              className="w-auto object-contain h-12" 
            />
            <span 
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#1b775bff' }}
            >
              Nature-Tech
            </span>
          </div>
          <p className="text-gray-500 text-lg mt-2">Create your account</p>
        </div>

        <Card className="border-none shadow-[0_8px_40px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl rounded-[32px] overflow-hidden">
          <CardHeader className="pb-0 pt-8 px-8">
            <CardTitle className="text-xl font-semibold text-[#1b775b] text-center">Sign Up</CardTitle>
            <div className="h-4"></div>
          </CardHeader>
          
          <CardContent className="p-8 pt-6">
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={18} />
                  </div>
                  <Input
                    type="email"
                    placeholder="name@naturetech.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/50 border-gray-200 h-12 pl-11 rounded-xl focus:ring-[#3FA77C] focus:border-[#3FA77C] transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={18} />
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/50 border-gray-200 h-12 pl-11 rounded-xl focus:ring-[#3FA77C] focus:border-[#3FA77C] transition-all"
                  />
                </div>
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#3FA77C] hover:bg-[#2e8560] h-12 rounded-xl text-base font-medium shadow-[0_4px_14px_rgba(63,167,124,0.3)] hover:shadow-[0_6px_20px_rgba(63,167,124,0.4)] transition-all duration-300 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign Up <UserPlus size={18} />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account? <span onClick={onNavigateToLogin} className="text-[#3FA77C] font-medium cursor-pointer hover:underline">Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}
