import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { api, type ActivityLog } from "@/lib/api";
import { Clock, User, Package, ArrowRight, History, Trash2, RotateCcw, FileEdit } from "lucide-react";
import InventoryHeader from "@/components/InventoryHeader";
import DateRangeFilter from "@/components/DateRangeFilter";
import type { Language } from "@/lib/translations";
import { useTranslation } from "@/lib/translations";

interface ActivityLogsProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToQRCodes?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToReports?: () => void;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export default function ActivityLogs({ userName, userRole, onLogout, onNavigateToInventory, onNavigateToReservations, onNavigateToQRCodes, onNavigateToMaintenance, onNavigateToReports, currentLanguage = 'en', onLanguageChange }: ActivityLogsProps) {
  const lang: Language = currentLanguage || 'en';
  const t = useTranslation(lang);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);

  const buildQueryKey = () => {
    const key = ['/api/activity-logs'];
    if (dateRange) {
      key.push(dateRange.startDate.toISOString(), dateRange.endDate.toISOString());
    }
    return key;
  };

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: buildQueryKey(),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.startDate.toISOString());
        params.append('endDate', dateRange.endDate.toISOString());
      }
      const url = `/api/activity-logs${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: editHistory = [] } = useQuery({
    queryKey: ['/api/item-edit-history', selectedItem],
    queryFn: () => fetch(`/api/item-edit-history/${selectedItem}`).then(r => r.json()),
    enabled: !!selectedItem,
  });

  const { data: statusHistory = [] } = useQuery({
    queryKey: ['/api/reservation-status-history', selectedReservation],
    queryFn: () => fetch(`/api/reservation-status-history/${selectedReservation}`).then(r => r.json()),
    enabled: !!selectedReservation,
  });

  const getActionColor = (action: string) => {
    if (action.includes('Checked Out') || action.includes('In Use')) return 'bg-blue-500';
    if (action.includes('Checked In') || action.includes('Available')) return 'bg-green-500';
    if (action.includes('Approved')) return 'bg-emerald-500';
    if (action.includes('Rejected')) return 'bg-red-500';
    if (action.includes('Reserved')) return 'bg-amber-500';
    if (action.includes('Deleted')) return 'bg-gray-500';
    if (action.includes('Restored')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const translateAction = (action: string): string => {
    return t(action as any) || action;
  };

  return (
    <div className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <InventoryHeader
        userName={userName}
        userRole={userRole}
        currentView="inventory"
        onViewChange={() => onNavigateToInventory?.()}
        onLogout={onLogout}
        onNavigateToReservations={onNavigateToReservations}
        onNavigateToActivityLogs={() => {}}
        onNavigateToQRCodes={onNavigateToQRCodes}
        onNavigateToMaintenance={onNavigateToMaintenance}
        onNavigateToReports={onNavigateToReports}
        hideViewToggle={true}
        language={lang}
        onLanguageChange={onLanguageChange || (() => {})}
      />

      <main className="max-w-[1400px] mx-auto px-5 py-8">
        <div className="text-center mb-10 p-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl text-white">
          <h1 className="text-4xl font-extrabold mb-4" data-testid="text-activity-title">
            {t('activityLogHistory')}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto" data-testid="text-activity-subtitle">
            {t('completeAuditTrail')}
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <DateRangeFilter
            onDateRangeChange={(range) => setDateRange(range)}
          />
        </div>

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">
              <Package className="w-4 h-4 mr-2" />
              {t('activityLogHistory')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('loadingActivityLogs')}</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{t('errorLoadingLogs')}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('noActivityLogs')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log: ActivityLog) => (
                  <Card key={log.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-semibold">{log.itemName}</h3>
                            <Badge variant="outline" className="text-xs">
                              {log.itemBarcode}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedItem(log.itemId)}
                              className="ml-auto"
                            >
                              <History className="w-4 h-4 mr-1" />
                              {t('editHistory')}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <User className="w-4 h-4" />
                            <span>{log.userName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {log.userRole}
                            </Badge>
                            {log.userDepartment && (
                              <Badge variant="outline" className="text-xs">
                                {log.userDepartment}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getActionColor(log.action)} text-white`}>
                            {translateAction(log.action)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-sm">
                        {log.oldStatus && (
                          <>
                            <Badge variant="outline">{log.oldStatus}</Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </>
                        )}
                        {log.newStatus && (
                          <Badge variant="outline">{log.newStatus}</Badge>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit History Dialog - READ ONLY */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('itemEditHistory')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {editHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('noEditHistory')}</p>
              ) : (
                editHistory.map((edit: any) => (
                  <Card key={edit.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant="outline">{edit.fieldName}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('by')} {edit.userName} • {format(new Date(edit.timestamp), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">{edit.oldValue || 'empty'}</Badge>
                        <ArrowRight className="w-4 h-4" />
                        <Badge variant="secondary">{edit.newValue || 'empty'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}