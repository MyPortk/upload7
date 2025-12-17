
import { useState, useEffect } from "react";
import { Package, Calendar, FileText, LogOut, Menu, X, Bell, Moon, Sun, Globe, Mail } from "lucide-react";
import { useTranslation, type Language, type TranslationKey } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/NotificationBell";

interface UserHeaderProps {
  userName: string;
  currentView: string;
  onNavigateToInventory: () => void;
  onNavigateToReservations: () => void;
  onNavigateToReports: () => void;
  onLogout: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export default function UserHeader({
  userName,
  currentView,
  onNavigateToInventory,
  onNavigateToReservations,
  onNavigateToReports,
  onLogout,
  language,
  onLanguageChange,
}: UserHeaderProps) {
  const t = useTranslation(language);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const { data: permissions = {} } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/permissions', { credentials: 'include' });
        if (!response.ok) return { show_language_toggle: true };
        return response.json();
      } catch {
        return { show_language_toggle: true };
      }
    },
  });

  const showLanguageToggle = permissions.show_language_toggle !== false;

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const menuItems: { icon: typeof Package; label: TranslationKey; action: () => void; view: string }[] = [
    { icon: Package, label: 'inventory', action: onNavigateToInventory, view: 'inventory' },
    { icon: Calendar, label: 'reservations', action: onNavigateToReservations, view: 'reservations' },
    { icon: FileText, label: 'reports', action: onNavigateToReports, view: 'reports' },
  ];

  const handleNavClick = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between py-6">
          {/* Logo, Title and Username - Left */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl tracking-tight" data-testid="text-header-logo">Inventory</span>
              <span className="text-sm font-medium opacity-90" data-testid="text-header-username">
                {userName}
              </span>
            </div>
          </div>

          {/* Navigation Menu - Center */}
          <nav className="hidden lg:flex items-center gap-0" data-testid="nav-desktop">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={item.action}
                  className={`relative flex items-center gap-2 px-4 py-2 font-semibold text-[15px] uppercase tracking-tight transition-all duration-300 group ${
                    isActive ? 'text-white' : 'text-gray-200'
                  }`}
                  data-testid={`button-header-nav-${item.view}`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{t(item.label)}</span>
                  <span 
                    className={`absolute left-0 bottom-0 h-1 bg-[#9841ff] transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* User Controls - Right */}
          <div className="hidden lg:flex items-center gap-2 min-w-[200px] justify-end">
            <NotificationBell language={language} />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-white hover:bg-white/10 h-9 w-9"
              data-testid="button-header-theme-toggle"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {showLanguageToggle && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-9 w-9"
                    data-testid="button-header-language-toggle"
                  >
                    <Globe className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem 
                    onClick={() => onLanguageChange('en')}
                    className={language === 'en' ? 'bg-accent' : ''}
                  >
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onLanguageChange('ar')}
                    className={language === 'ar' ? 'bg-accent' : ''}
                  >
                    العربية
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              onClick={onLogout}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 h-9 w-9"
              data-testid="button-header-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded hover:bg-white/10 transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden pb-6 space-y-2" data-testid="nav-mobile">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.action)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-[#667eea] font-semibold'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  data-testid={`button-mobile-nav-${item.view}`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{t(item.label)}</span>
                </button>
              );
            })}
            
            <div className="border-t border-white/20 pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-end gap-2 px-4">
                <NotificationBell language={language} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-white hover:bg-white/20"
                  data-testid="button-mobile-theme-toggle"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                {showLanguageToggle && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        data-testid="button-mobile-language-toggle"
                      >
                        <Globe className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem 
                        onClick={() => onLanguageChange('en')}
                        className={language === 'en' ? 'bg-accent' : ''}
                      >
                        English
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onLanguageChange('ar')}
                        className={language === 'ar' ? 'bg-accent' : ''}
                      >
                        العربية
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <button
                onClick={() => handleNavClick(onLogout)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all text-red-100"
                data-testid="button-mobile-logout"
              >
                <LogOut className="w-5 h-5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
