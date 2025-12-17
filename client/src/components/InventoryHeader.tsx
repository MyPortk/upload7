import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { useTranslation, Language } from "@/lib/translations";

interface InventoryHeaderProps {
  userName: string;
  userRole: string;
  currentView: 'categories' | 'inventory';
  onViewChange: (view: 'categories' | 'inventory') => void;
  onLogout: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToActivityLogs?: () => void;
  onNavigateToQRCodes?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToReports?: () => void;
  hideViewToggle?: boolean;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
}

export default function InventoryHeader({
  language = 'en',
  onLanguageChange
}: InventoryHeaderProps) {
  const t = useTranslation(language);

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

  return (
    <header className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 h-16 flex items-center px-6">
      <div className="flex items-center justify-end gap-4 w-full">
        {/* Notification Bell */}
        <NotificationBell language={language} />
        
        {/* Dark Mode Toggle */}
        <ThemeToggle />

        {/* Language Toggle */}
        {showLanguageToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                data-testid="button-language-toggle"
              >
                <Globe className="w-4 h-4" />
                <span>{language === 'en' ? 'EN' : 'AR'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem 
                onClick={() => onLanguageChange?.('en')} 
                className={language === 'en' ? 'bg-accent' : ''}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onLanguageChange?.('ar')} 
                className={language === 'ar' ? 'bg-accent' : ''}
              >
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
