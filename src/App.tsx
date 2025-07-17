import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Contacts from './components/Contacts';
import Opportunities from './components/Opportunities';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Email from './components/Email';
import Analytics from './components/Analytics';
import Integrations from './components/Integrations';
import Settings from './components/Settings';
import JoinOrganization from './components/JoinOrganization';
import OrganizationManagement from './components/OrganizationManagement';
// authService might still be needed by LandingPage, or LandingPage uses useAuth for login action

export type View = 'dashboard' | 'contacts' | 'opportunities' | 'tasks' | 'calendar' | 'email' | 'analytics' | 'integrations' | 'settings' | 'join-organization' | 'organization-management';

function App() {
  // Get auth state and functions from AuthContext
  const auth = useAuth(); 
  // const { isAuthenticated, isLoading, currentUser, login, logout, checkAuthStatusOnAppLoad } = useAuth(); // Destructure if preferred

  // activeView and searchTerm remain local UI state to App.tsx
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Check authentication status on app load using AuthContext
  useEffect(() => {
    auth.checkAuthStatusOnAppLoad();
  }, []); // Runs once on mount

  // Effect to handle post-authentication actions, like setting default view
  useEffect(() => {
    if (auth.isAuthenticated) {
      // If user is authenticated, ensure the view is appropriate (e.g., dashboard)
      // This also handles the "redirect from home to dashboard" requirement,
      // as LandingPage (home) won't be shown, and 'dashboard' is the default activeView.
      if (activeView !== 'dashboard' && !searchTerm) { // Example condition, could be more specific
         // setActiveView('dashboard'); // Already defaults to dashboard
      }
      // Potentially handle auth.currentUser.first_time_login here for onboarding
      if (auth.currentUser && auth.currentUser.first_time_login === 1) { // Note: first_time_login in DB is 0 or 1
          console.log('First time login detected for user:', auth.currentUser.name);
          // Add logic here: e.g., setActiveView to an onboarding component or show a modal
          // For now, just logging. If a specific view for first-timers is needed, it can be set here.
      }

    } else {
      // If user becomes unauthenticated (e.g., logout, session expiry),
      // reset to a default safe view if needed, though LandingPage will show.
      // setActiveView('dashboard'); // Or a loginRedirectView if that existed
    }
  }, [auth.isAuthenticated, auth.currentUser]);


  // LandingPage's onLogin prop will now expect LoginResponse data
  // and then call auth.login with it.
  // This means LandingPage needs to handle the actual API call to authService.login.
  // For now, we'll pass auth.login directly. LandingPage needs to be adapted.
  // const handleLoginSuccess = (loginResponseData: LoginResponse) => { 
  //   auth.login(loginResponseData);
  // };

  const handleLogout = async () => {
    await auth.logout();
    setActiveView('dashboard'); // Reset view after logout
    setSearchTerm('');
  };
  
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'contacts':
        return <Contacts searchTerm={searchTerm} />;
      case 'opportunities':
        return <Opportunities searchTerm={searchTerm} />;
      case 'tasks':
        return <Tasks searchTerm={searchTerm} />;
      case 'calendar':
        return <Calendar searchTerm={searchTerm} />;
      case 'email':
        return <Email searchTerm={searchTerm} />;
      case 'analytics':
        return <Analytics />;
      case 'integrations':
        return <Integrations />;
      case 'settings':
        return <Settings />;
      case 'join-organization':
        return <JoinOrganization searchTerm={searchTerm} />;
      case 'organization-management':
        return <OrganizationManagement />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading spinner while checking authentication from AuthContext
  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p> {/* Consider localizing "Chargement..." */}
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <LanguageProvider>
        {/* LandingPage's onLogin now needs to be changed.
            It should perform the API login and then call auth.login(response)
            For now, we pass auth.login, assuming LandingPage is adapted.
        */}
        <LandingPage onLogin={auth.login} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <OrganizationProvider>
        <div className="min-h-screen bg-mesh flex">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
          <div className="flex-1 flex flex-col lg:ml-0">
            <Header 
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm}
              activeView={activeView}
              onViewChange={setActiveView}
              onLogout={handleLogout}
            />
            <main className="flex-1 overflow-auto p-4 lg:p-6">
              <div className="max-w-7xl mx-auto">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      </OrganizationProvider>
    </LanguageProvider>
  );
}

export default App;