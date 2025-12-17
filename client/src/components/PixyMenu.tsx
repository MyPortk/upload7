import { 
  LayoutDashboard, 
  Package, 
  Calendar, 
  Activity, 
  QrCode, 
  Wrench, 
  BarChart3, 
  Users, 
  Shield,
  LogOut,
  Globe,
  Home
} from "lucide-react";
import type { Language } from "@/lib/translations";

type View = 'login' | 'home' | 'dashboard' | 'inventory' | 'reservations' | 'activity-logs' | 'qr-codes' | 'maintenance' | 'users' | 'reports' | 'permissions';

interface PixyMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: View;
  userRole: string;
  userName: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigateToHome: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToInventory: () => void;
  onNavigateToReservations: () => void;
  onNavigateToActivityLogs: () => void;
  onNavigateToQRCodes: () => void;
  onNavigateToMaintenance: () => void;
  onNavigateToReports: () => void;
  onNavigateToUsers: () => void;
  onNavigateToPermissions: () => void;
  onLogout: () => void;
}

export default function PixyMenu({
  isOpen,
  onClose,
  currentView,
  userRole,
  userName,
  language,
  onLanguageChange,
  onNavigateToHome,
  onNavigateToDashboard,
  onNavigateToInventory,
  onNavigateToReservations,
  onNavigateToActivityLogs,
  onNavigateToQRCodes,
  onNavigateToMaintenance,
  onNavigateToReports,
  onNavigateToUsers,
  onNavigateToPermissions,
  onLogout
}: PixyMenuProps) {
  const isAdminOrDeveloper = userRole === 'admin' || userRole === 'developer';
  const isDeveloper = userRole === 'developer';

  const handleNavigation = (navigate: () => void) => {
    navigate();
    onClose();
  };

  const menuItems = [
    {
      id: 'home',
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      icon: Home,
      onClick: () => handleNavigation(onNavigateToHome),
      isActive: currentView === 'home'
    },
    ...(isAdminOrDeveloper ? [{
      id: 'dashboard',
      label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => handleNavigation(onNavigateToDashboard),
      isActive: currentView === 'dashboard'
    }] : []),
    {
      id: 'inventory',
      label: language === 'ar' ? 'المخزون' : 'Inventory',
      icon: Package,
      onClick: () => handleNavigation(onNavigateToInventory),
      isActive: currentView === 'inventory'
    },
    {
      id: 'reservations',
      label: language === 'ar' ? 'الحجوزات' : 'Reservations',
      icon: Calendar,
      onClick: () => handleNavigation(onNavigateToReservations),
      isActive: currentView === 'reservations'
    },
    ...(isAdminOrDeveloper ? [{
      id: 'activity-logs',
      label: language === 'ar' ? 'سجل النشاط' : 'Activity Logs',
      icon: Activity,
      onClick: () => handleNavigation(onNavigateToActivityLogs),
      isActive: currentView === 'activity-logs'
    }] : []),
    ...(isAdminOrDeveloper ? [{
      id: 'qr-codes',
      label: language === 'ar' ? 'رموز QR' : 'QR Codes',
      icon: QrCode,
      onClick: () => handleNavigation(onNavigateToQRCodes),
      isActive: currentView === 'qr-codes'
    }] : []),
    ...(isAdminOrDeveloper ? [{
      id: 'maintenance',
      label: language === 'ar' ? 'الصيانة' : 'Maintenance',
      icon: Wrench,
      onClick: () => handleNavigation(onNavigateToMaintenance),
      isActive: currentView === 'maintenance'
    }] : []),
    {
      id: 'reports',
      label: language === 'ar' ? 'التقارير' : 'Reports',
      icon: BarChart3,
      onClick: () => handleNavigation(onNavigateToReports),
      isActive: currentView === 'reports'
    },
    ...(isAdminOrDeveloper ? [{
      id: 'users',
      label: language === 'ar' ? 'المستخدمين' : 'Users',
      icon: Users,
      onClick: () => handleNavigation(onNavigateToUsers),
      isActive: currentView === 'users'
    }] : []),
    ...(isDeveloper ? [{
      id: 'permissions',
      label: language === 'ar' ? 'الصلاحيات' : 'Permissions',
      icon: Shield,
      onClick: () => handleNavigation(onNavigateToPermissions),
      isActive: currentView === 'permissions'
    }] : [])
  ];

  return (
    <>
      <div 
        className={`mil-menu-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
        data-testid="menu-overlay"
      />
      
      <nav className={`mil-menu-frame ${isOpen ? 'active' : ''}`} data-testid="menu-frame">
        <div className="p-10 pt-24">
          <div className="mb-8">
            <p className="mil-stylized mil-m2 mb-2">
              {language === 'ar' ? 'مرحباً' : 'Welcome'}
            </p>
            <h3 className="mil-head3 mil-m1" data-testid="text-user-name">{userName}</h3>
            <p className="mil-text-sm mil-m2 capitalize" data-testid="text-user-role">{userRole}</p>
          </div>

          <ul className="mil-main-menu" data-testid="menu-list">
            {menuItems.map((item) => (
              <li key={item.id} className={item.isActive ? 'active' : ''}>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); item.onClick(); }}
                  data-testid={`menu-item-${item.id}`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center gap-4 mb-6">
              <Globe className="w-5 h-5 mil-m2" />
              <div className="flex gap-2">
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    language === 'en' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  data-testid="button-lang-en"
                >
                  EN
                </button>
                <button
                  onClick={() => onLanguageChange('ar')}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    language === 'ar' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  data-testid="button-lang-ar"
                >
                  AR
                </button>
              </div>
            </div>

            <button
              onClick={() => { onLogout(); onClose(); }}
              className="flex items-center gap-3 text-destructive hover:text-destructive/80 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="mil-stylized">
                {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
