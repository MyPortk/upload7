import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Package, Calendar, ClipboardList, QrCode, Wrench, Users, FileText, LogOut, Shield, ChevronLeft } from "lucide-react";
import { useTranslation, type Language } from "@/lib/translations";

interface SidebarProps {
  userName: string;
  userRole: string;
  currentView: string;
  onNavigateToDashboard?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToActivityLogs?: () => void;
  onNavigateToQRCodes?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToPermissions?: () => void;
  onLogout: () => void;
  language: Language;
}

export default function Sidebar({
  userName,
  userRole,
  currentView,
  onNavigateToDashboard,
  onNavigateToInventory,
  onNavigateToReservations,
  onNavigateToActivityLogs,
  onNavigateToQRCodes,
  onNavigateToMaintenance,
  onNavigateToReports,
  onNavigateToUsers,
  onNavigateToPermissions,
  onLogout,
  language,
}: SidebarProps) {
  const t = useTranslation(language);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: permissions = {} } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/permissions', { credentials: 'include' });
        if (!response.ok) return { hide_sidebar_toggle: true, sidebar_auto_hide: false };
        return response.json();
      } catch {
        return { hide_sidebar_toggle: true, sidebar_auto_hide: false };
      }
    },
  });

  const showCollapseButton = permissions.hide_sidebar_toggle !== false;
  const enableAutoHide = permissions.sidebar_auto_hide === true;

  useEffect(() => {
    if (!enableAutoHide) {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }

      if (mouseX < 20) {
        // Mouse is near left edge, show sidebar
        setIsCollapsed(false);
      } else if (isCollapsed) {
        // Mouse is not near left edge and sidebar is already collapsed, keep it collapsed
        return;
      } else if (mouseX > 280) {
        // Mouse is outside sidebar area, schedule auto-hide
        autoHideTimeoutRef.current = setTimeout(() => {
          setIsCollapsed(true);
        }, 1000); // 1 second delay before auto-hiding
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [isCollapsed, enableAutoHide]);

  const isAdmin = userRole === 'admin' || userRole === 'developer';
  const isDeveloper = userRole === 'developer';

  const menuItems = [
    ...(isAdmin
      ? [
          { icon: LayoutDashboard, label: 'dashboard', action: onNavigateToDashboard, view: 'dashboard' },
        ]
      : []),
    { icon: Package, label: 'inventory', action: onNavigateToInventory, view: 'inventory' },
    { icon: Calendar, label: 'reservations', action: onNavigateToReservations, view: 'reservations' },
    ...(isAdmin
      ? [
          { icon: QrCode, label: 'qr_codes', action: onNavigateToQRCodes, view: 'qr-codes' },
          { icon: Wrench, label: 'maintenance', action: onNavigateToMaintenance, view: 'maintenance' },
          { icon: ClipboardList, label: 'activity_logs', action: onNavigateToActivityLogs, view: 'activity-logs' },
        ]
      : []),
    { icon: FileText, label: 'reports', action: onNavigateToReports, view: 'reports' },
    ...(isAdmin
      ? [
          { icon: Users, label: 'user_management', action: onNavigateToUsers, view: 'users' },
        ]
      : []),
    ...(isDeveloper
      ? [
          { icon: Shield, label: 'permissions', action: onNavigateToPermissions, view: 'permissions' },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen bg-background relative">
      {/* Floating Expand Button - appears when sidebar is hidden */}
      {showCollapseButton && isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-2 top-4 z-50 p-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg transition-all duration-300 backdrop-blur-sm hover:scale-110"
          data-testid="button-expand-sidebar"
          title="Expand sidebar"
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
      )}

      {/* Main Sidebar */}
      <div 
        ref={sidebarRef}
        className={`bg-gradient-to-b from-[#667eea] to-[#764ba2] text-white flex flex-col fixed h-screen overflow-y-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 -translate-x-60 opacity-0' : 'w-60 translate-x-0 opacity-100'}`}
      >
        {showCollapseButton && (
          <div className="p-3 flex justify-end">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all backdrop-blur-sm hover:scale-110"
              data-testid="button-collapse-sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white bg-opacity-25 font-semibold'
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                data-testid={`button-nav-${item.view}`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span>{t(item.label)}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-white border-opacity-20 p-4 space-y-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all text-red-200"
            data-testid="button-logout-sidebar"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-auto transition-all duration-300 ease-in-out" 
        style={{ 
          marginLeft: isCollapsed ? '0' : '15rem'
        }} 
      />
    </div>
  );
}
