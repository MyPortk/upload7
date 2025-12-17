import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import InventoryHeader from "@/components/InventoryHeader";
import { useToast } from "@/hooks/use-toast";
import type { Language } from "@/lib/translations";
import { useTranslation } from "@/lib/translations";
import { ArrowLeft, Shield } from "lucide-react";

interface PermissionsProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToActivityLogs?: () => void;
  onNavigateToQRCodes?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToReports?: () => void;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
}

export default function Permissions({
  userName,
  userRole,
  onLogout,
  onNavigateToInventory,
  onNavigateToReservations,
  onNavigateToActivityLogs,
  onNavigateToQRCodes,
  onNavigateToMaintenance,
  onNavigateToReports,
  language = 'en',
  onLanguageChange
}: PermissionsProps) {
  const { toast } = useToast();
  const t = useTranslation(language);

  const { data: permissions = {} } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      const response = await fetch('/api/permissions', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    }
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const response = await fetch(`/api/permissions/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      toast({ title: "Permission updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update permission", variant: "destructive" });
    }
  });

  const handleToggle = (key: string, currentValue: boolean) => {
    updatePermissionMutation.mutate({ key, enabled: !currentValue });
  };

  return (
    <div className="min-h-screen bg-background">
      <InventoryHeader
        userName={userName}
        userRole={userRole}
        currentView="inventory"
        onViewChange={() => onNavigateToInventory?.()}
        onLogout={onLogout}
        onNavigateToReservations={onNavigateToReservations}
        onNavigateToActivityLogs={onNavigateToActivityLogs}
        onNavigateToQRCodes={onNavigateToQRCodes}
        onNavigateToMaintenance={onNavigateToMaintenance}
        onNavigateToReports={onNavigateToReports}
        hideViewToggle={true}
        language={language}
        onLanguageChange={onLanguageChange}
      />

      <main className="max-w-[1400px] mx-auto px-5 py-8">
        <div className="text-center mb-10 p-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10" />
            <h1 className="text-4xl font-extrabold" data-testid="text-permissions-title">
              System Permissions
            </h1>
          </div>
          <p className="text-lg opacity-90 max-w-2xl mx-auto" data-testid="text-permissions-subtitle">
            Configure system-wide settings and permissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets Toggle */}
          <Card className="hover-elevate" data-testid="card-permission-assets">
            <CardHeader>
              <CardTitle className="text-lg">{t('assets') || 'Assets'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('enableAssetsDescription') || 'When enabled, users will see the Assets option on the inventory category page alongside Equipment. When disabled, only Equipment will be visible.'}
              </p>
              <div className="flex items-center gap-4">
                <Switch
                  checked={permissions.show_assets !== false}
                  onCheckedChange={() =>
                    handleToggle('show_assets', permissions.show_assets !== false)
                  }
                  disabled={updatePermissionMutation.isPending}
                  data-testid="switch-permission-assets"
                />
                <span className="text-sm font-medium">
                  {permissions.show_assets !== false ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Language Toggle */}
          <Card className="hover-elevate" data-testid="card-permission-language">
            <CardHeader>
              <CardTitle className="text-lg">{t('language') || 'Language'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('enableLanguageDescription') || 'When enabled, all users can toggle between English and Arabic languages. When disabled, the language toggle will be hidden for all accounts.'}
              </p>
              <div className="flex items-center gap-4">
                <Switch
                  checked={permissions.show_language_toggle !== false}
                  onCheckedChange={() =>
                    handleToggle('show_language_toggle', permissions.show_language_toggle !== false)
                  }
                  disabled={updatePermissionMutation.isPending}
                  data-testid="switch-permission-language"
                />
                <span className="text-sm font-medium">
                  {permissions.show_language_toggle !== false ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Collapse Toggle */}
          <Card className="hover-elevate" data-testid="card-permission-sidebar">
            <CardHeader>
              <CardTitle className="text-lg">Sidebar Collapse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                When enabled, users can collapse the sidebar using the arrow button at the top. When disabled, the sidebar remains visible at all times.
              </p>
              <div className="flex items-center gap-4">
                <Switch
                  checked={permissions.hide_sidebar_toggle !== false}
                  onCheckedChange={() =>
                    handleToggle('hide_sidebar_toggle', permissions.hide_sidebar_toggle !== false)
                  }
                  disabled={updatePermissionMutation.isPending}
                  data-testid="switch-permission-sidebar"
                />
                <span className="text-sm font-medium">
                  {permissions.hide_sidebar_toggle !== false ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Auto-Hide Toggle */}
          <Card className="hover-elevate" data-testid="card-permission-sidebar-autohide">
            <CardHeader>
              <CardTitle className="text-lg">Sidebar Auto-Hide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                When enabled, the sidebar automatically hides after 1 second when the mouse moves away from it. It automatically reappears when the mouse moves near the left edge of the screen.
              </p>
              <div className="flex items-center gap-4">
                <Switch
                  checked={permissions.sidebar_auto_hide === true}
                  onCheckedChange={() =>
                    handleToggle('sidebar_auto_hide', permissions.sidebar_auto_hide === true)
                  }
                  disabled={updatePermissionMutation.isPending}
                  data-testid="switch-permission-sidebar-autohide"
                />
                <span className="text-sm font-medium">
                  {permissions.sidebar_auto_hide === true ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
