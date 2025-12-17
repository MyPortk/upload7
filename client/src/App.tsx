import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import UserHome from "@/pages/UserHome";
import Reservations from "@/pages/Reservations";
import ActivityLogs from "@/pages/ActivityLogs";
import QRCodes from "@/pages/QRCodes";
import Maintenance from "@/pages/Maintenance";
import UserManagement from "@/pages/UserManagement";
import Reports from "@/pages/Reports";
import Permissions from "@/pages/Permissions";
import PixyHeader from "@/components/PixyHeader";
import PixyMenu from "@/components/PixyMenu";
import type { Language } from "@/lib/translations";

type View = 'login' | 'home' | 'dashboard' | 'inventory' | 'reservations' | 'activity-logs' | 'qr-codes' | 'maintenance' | 'users' | 'reports' | 'permissions';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('login');
  const [language, setLanguage] = useState<Language>('en');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    role: string;
    name: string;
  } | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const initialView = (user.role === 'admin' || user.role === 'developer') ? 'dashboard' : 'home';
    setCurrentView(initialView);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView('login');
    localStorage.removeItem('currentUser');
  };

  const handleNavigateToDashboard = () => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'developer') {
      setCurrentView('dashboard');
    }
  };

  const handleNavigateToHome = () => {
    setSelectedCategory(null);
    setCurrentView('home');
  };
  const handleNavigateToInventory = () => {
    setSelectedCategory(null);
    setCurrentView('inventory');
  };
  const handleNavigateToReservations = () => setCurrentView('reservations');
  const handleNavigateToActivityLogs = () => setCurrentView('activity-logs');
  const handleNavigateToQRCodes = () => setCurrentView('qr-codes');
  const handleNavigateToMaintenance = () => setCurrentView('maintenance');
  const handleNavigateToReports = () => setCurrentView('reports');
  const handleNavigateToUsers = () => setCurrentView('users');
  const handleNavigateToPermissions = () => {
    if (currentUser?.role === 'developer') {
      setCurrentView('permissions');
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        const user = data.user || data;
        handleLogin(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            handleLogin(user);
          } catch {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          handleLogin(user);
        } catch {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } finally {
      setIsSessionLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage) {
      setLanguage(savedLanguage);
      document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    }
    (window as any).navigateToUsers = () => setCurrentView('users');
    (window as any).navigateToReports = () => setCurrentView('reports');
  }, []);

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="mil-stylized mil-m2">Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
    }

    const commonProps = {
      userName: currentUser?.name || 'User',
      userRole: currentUser?.role || 'user',
      onLogout: handleLogout,
      currentLanguage: language,
      onLanguageChange: handleLanguageChange,
    };

    switch (currentView) {
      case 'home':
        return (
          <UserHome
            {...commonProps}
            userId={currentUser?.id || ''}
            onNavigateToInventory={handleNavigateToInventory}
            onNavigateToReservations={handleNavigateToReservations}
            onNavigateToReports={handleNavigateToReports}
            onSelectCategory={(categoryId: string) => {
              setSelectedCategory(categoryId);
              setCurrentView('inventory');
            }}
          />
        );
      case 'dashboard':
        if (currentUser?.role === 'admin' || currentUser?.role === 'developer') {
          return (
            <Dashboard
              {...commonProps}
              userId={currentUser?.id || ''}
              onNavigateToDashboard={handleNavigateToDashboard}
              onNavigateToInventory={handleNavigateToInventory}
              onNavigateToReservations={handleNavigateToReservations}
              onNavigateToActivityLogs={handleNavigateToActivityLogs}
              onNavigateToQRCodes={handleNavigateToQRCodes}
              onNavigateToMaintenance={handleNavigateToMaintenance}
              onNavigateToReports={handleNavigateToReports}
            />
          );
        }
        return null;
      case 'inventory':
        return (
          <Inventory
            {...commonProps}
            userId={currentUser?.id || ''}
            onNavigateToDashboard={handleNavigateToDashboard}
            onNavigateToReservations={handleNavigateToReservations}
            onNavigateToActivityLogs={handleNavigateToActivityLogs}
            onNavigateToQRCodes={handleNavigateToQRCodes}
            onNavigateToMaintenance={handleNavigateToMaintenance}
            onNavigateToReports={handleNavigateToReports}
            initialCategory={selectedCategory}
          />
        );
      case 'reservations':
        return (
          <Reservations
            {...commonProps}
            userId={currentUser?.id || ''}
            onNavigateToInventory={handleNavigateToInventory}
            onNavigateToActivityLogs={handleNavigateToActivityLogs}
            onNavigateToQRCodes={handleNavigateToQRCodes}
            onNavigateToMaintenance={handleNavigateToMaintenance}
            onNavigateToReports={handleNavigateToReports}
          />
        );
      case 'activity-logs':
        return (
          <ActivityLogs
            {...commonProps}
            onNavigateToInventory={handleNavigateToInventory}
            onNavigateToReservations={handleNavigateToReservations}
            onNavigateToQRCodes={handleNavigateToQRCodes}
            onNavigateToMaintenance={handleNavigateToMaintenance}
            onNavigateToReports={handleNavigateToReports}
          />
        );
      case 'qr-codes':
        return (
          <QRCodes
            {...commonProps}
            onNavigateToInventory={handleNavigateToInventory}
            onNavigateToReservations={handleNavigateToReservations}
            onNavigateToActivityLogs={handleNavigateToActivityLogs}
            onNavigateToMaintenance={handleNavigateToMaintenance}
            onNavigateToReports={handleNavigateToReports}
          />
        );
      case 'maintenance':
        return (
          <Maintenance
            {...commonProps}
            userId={currentUser?.id || ''}
            onNavigateToInventory={handleNavigateToInventory}
            onNavigateToReservations={handleNavigateToReservations}
            onNavigateToActivityLogs={handleNavigateToActivityLogs}
            onNavigateToQRCodes={handleNavigateToQRCodes}
            onNavigateToReports={handleNavigateToReports}
          />
        );
      case 'users':
        return (
          <UserManagement
            {...commonProps}
            language={language}
            onNavigateToInventory={handleNavigateToInventory}
            onNavigateToReservations={handleNavigateToReservations}
            onNavigateToActivityLogs={handleNavigateToActivityLogs}
            onNavigateToQRCodes={handleNavigateToQRCodes}
            onNavigateToMaintenance={handleNavigateToMaintenance}
            onNavigateToReports={handleNavigateToReports}
          />
        );
      case 'reports':
        return (
          <Reports
            {...commonProps}
            userId={currentUser?.id || ''}
            onNavigateToInventory={handleNavigateToInventory}
            onNavigateToReservations={handleNavigateToReservations}
            onNavigateToActivityLogs={handleNavigateToActivityLogs}
            onNavigateToQRCodes={handleNavigateToQRCodes}
            onNavigateToMaintenance={handleNavigateToMaintenance}
          />
        );
      case 'permissions':
        return (
          <Permissions
            {...commonProps}
            onNavigateToInventory={handleNavigateToInventory}
            onNavigateToReservations={handleNavigateToReservations}
            onNavigateToActivityLogs={handleNavigateToActivityLogs}
            onNavigateToQRCodes={handleNavigateToQRCodes}
            onNavigateToMaintenance={handleNavigateToMaintenance}
            onNavigateToReports={handleNavigateToReports}
            language={language}
          />
        );
      default:
        return null;
    }
  };

  const content = renderContent();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!isAuthenticated ? (
          content
        ) : (
          <div className="min-h-screen bg-background">
            <PixyHeader
              isMenuOpen={isMenuOpen}
              onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
            />
            <PixyMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              currentView={currentView}
              userRole={currentUser?.role || 'user'}
              userName={currentUser?.name || 'User'}
              language={language}
              onLanguageChange={handleLanguageChange}
              onNavigateToHome={handleNavigateToHome}
              onNavigateToDashboard={handleNavigateToDashboard}
              onNavigateToInventory={handleNavigateToInventory}
              onNavigateToReservations={handleNavigateToReservations}
              onNavigateToActivityLogs={handleNavigateToActivityLogs}
              onNavigateToQRCodes={handleNavigateToQRCodes}
              onNavigateToMaintenance={handleNavigateToMaintenance}
              onNavigateToReports={handleNavigateToReports}
              onNavigateToUsers={handleNavigateToUsers}
              onNavigateToPermissions={handleNavigateToPermissions}
              onLogout={handleLogout}
            />
            <main className="pt-20">
              {content}
            </main>
          </div>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
