import { useState } from 'react';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { CompleteProfile } from './pages/CompleteProfile';
import { TopNavBar } from './components/TopNavBar';
import { BottomDrawer } from './components/BottomDrawer';
import { MainMenu } from './pages/MainMenu';
import { Account } from './pages/Account';
import { Requests } from './pages/Requests';
import { Records } from './pages/Records';
import { Dashboard } from './pages/Dashboard';
import { Support } from './pages/Support';
import { LiveSiteConditions } from './pages/LiveSiteConditions';
import { AddBlocks } from './components/AddBlocks';
import { AlertsPage } from './components/AlertsPage';

type Screen = 'main-menu' | 'account' | 'requests' | 'records' | 'dashboard' | 'support' | 'live-site' | 'add-blocks' | 'alerts';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main-menu');
  const [user, setUser] = useState<any>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [newSiteData, setNewSiteData] = useState<{id: string, name: string} | null>(null);

  if (!user) {
    if (authScreen === 'signup') {
      return <SignUp onNavigateToLogin={() => setAuthScreen('login')} />;
    }
    return (
      <Login 
        onLogin={(userData) => setUser(userData)} 
        onNavigateToSignUp={() => setAuthScreen('signup')} 
      />
    );
  }

  // Check if profile is complete (assuming full_name is a required field in profile completion)
  if (!user.full_name) {
    return (
      <CompleteProfile 
        userId={user.user_id} 
        onComplete={(updatedUser) => setUser(updatedUser)} 
      />
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'account':
        return <Account onBack={() => setCurrentScreen('main-menu')} onLogout={handleLogout} user={user} />;
      case 'requests':
        return (
          <Requests 
            userId={user.user_id} 
            onBack={() => setCurrentScreen('main-menu')} 
            onSiteCreated={(siteId, siteName) => {
              setNewSiteData({ id: siteId, name: siteName });
              setCurrentScreen('add-blocks');
            }}
          />
        );
      case 'add-blocks':
        return (
          <AddBlocks 
            siteId={newSiteData?.id || ''} 
            siteName={newSiteData?.name || ''} 
            onBack={() => setCurrentScreen('requests')}
            onFinish={() => setCurrentScreen('main-menu')}
          />
        );
      case 'records':
        return <Records onBack={() => setCurrentScreen('main-menu')} user={user} />;
      case 'dashboard':
        return <Dashboard onBack={() => setCurrentScreen('main-menu')} />;
      case 'alerts':
        return <AlertsPage onBack={() => setCurrentScreen('main-menu')} />;
      case 'support':
        return <Support onBack={() => setCurrentScreen('main-menu')} />;
      case 'live-site':
        return <LiveSiteConditions onBack={() => setCurrentScreen('main-menu')} user={user} />;
      case 'main-menu':
      default:
        return <MainMenu onNavigate={setCurrentScreen} user={user} />;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('main-menu');
    setAuthScreen('login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF5]">
      {/* Global Header - Logo on Top Left */}
      <div className="shrink-0 z-50 relative">
        <TopNavBar 
          onNavigate={(screen) => setCurrentScreen(screen)} 
          onLogout={handleLogout}
          user={user}
        />
      </div>
      
      {/* Spacer to force separation */}
      <div className="h-6 shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {renderScreen()}
      </div>

      {/* Global Bottom Drawer - Hidden on Main Menu and Live Site Conditions */}
      {currentScreen !== 'main-menu' && currentScreen !== 'live-site' && (
        <BottomDrawer onToggle={() => {}} user={user} />
      )}
    </div>
  );
}