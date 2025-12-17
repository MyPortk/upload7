import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, ArrowLeft, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import InventoryHeader from "@/components/InventoryHeader";
import DateRangeFilter from "@/components/DateRangeFilter";
import type { Language } from "@/lib/translations";
import { useTranslation } from "@/lib/translations";

interface ReportsPageProps {
  userName: string;
  userRole: string;
  userId: string;
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

export default function Reports({
  userName,
  userRole,
  userId,
  onLogout,
  onNavigateToInventory,
  onNavigateToReservations,
  onNavigateToActivityLogs,
  onNavigateToQRCodes,
  onNavigateToMaintenance,
  onNavigateToReports,
  language = 'en',
  onLanguageChange
}: ReportsPageProps) {
  const t = useTranslation(language);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);

  const buildQueryKey = () => {
    const key = ['/api/damage-reports'];
    if (dateRange) {
      key.push(dateRange.startDate.toISOString(), dateRange.endDate.toISOString());
    }
    return key;
  };

  const { data: reports = [] } = useQuery({
    queryKey: buildQueryKey(),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.startDate.toISOString());
        params.append('endDate', dateRange.endDate.toISOString());
      }
      const url = `/api/damage-reports${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => api.items.getAll(),
  });

  const filteredReports = reports
    .filter(report => {
      const itemName = items.find(i => i.id === report.itemId)?.productName?.toLowerCase() || "";
      const matchesSearch = searchQuery === "" || itemName.includes(searchQuery.toLowerCase());
      const matchesRole = (userRole === 'admin' || userRole === 'developer') || report.reportedBy === userId;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
        onNavigateToReports={() => {}}
        hideViewToggle={true}
        language={language}
        onLanguageChange={onLanguageChange}
      />

      <main className="max-w-[1400px] mx-auto px-3 md:px-5 py-4 md:py-8">
        <div className="text-center mb-10 p-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl text-white">
          <h1 className="text-4xl font-extrabold mb-4" data-testid="text-reports-title">
            {t('damageReports')}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto" data-testid="text-reports-subtitle">
            {(userRole === 'admin' || userRole === 'developer')
              ? t('viewAllDamageReports')
              : t('viewDamageReportsReceived')}
          </p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('searchItems')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
              data-testid="input-search-reports"
            />
          </div>
          <DateRangeFilter
            onDateRangeChange={(range) => setDateRange(range)}
          />
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">{t('noItemsFound')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="p-4 md:p-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">
                      {items.find(i => i.id === report.itemId)?.productName || t('noItems')}
                    </h3>
                  </div>
                  
                  <div className="space-y-2 text-sm md:text-base">
                    <div><strong>{t('type')}:</strong> {report.reportType === 'user-damage' ? t('user') + ' (' + t('pickupDateTime') + ')' : t('admin') + ' (' + t('returnDateTime') + ')'}</div>
                    <div><strong>{t('requested')}:</strong> {format(new Date(report.createdAt), "PPP p")}</div>
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
                      <strong className="block mb-1 text-red-700 dark:text-red-300">{t('describeDamage')}:</strong> 
                      <p className="text-sm md:text-base text-red-600 dark:text-red-400">{report.description}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
