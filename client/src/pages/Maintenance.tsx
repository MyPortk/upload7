import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import InventoryHeader from "@/components/InventoryHeader";
import ItemCard from "@/components/ItemCard";
import ItemFormDialog from "@/components/ItemFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, LayoutGrid, TableIcon, Wrench } from "lucide-react";
import { api, type Item } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Language } from "@/lib/translations";
import { useTranslation } from '@/lib/translations';

interface MaintenancePageProps {
  userName: string;
  userRole: string;
  userId: string;
  onLogout: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToActivityLogs?: () => void;
  onNavigateToQRCodes?: () => void;
  onNavigateToReports?: () => void;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
}

export default function Maintenance({
  userName,
  userRole,
  userId,
  onLogout,
  onNavigateToInventory,
  onNavigateToReservations,
  onNavigateToActivityLogs,
  onNavigateToQRCodes,
  onNavigateToReports,
  language = 'en',
  onLanguageChange
}: MaintenancePageProps) {
  const { toast } = useToast();
  const t = useTranslation(language);
  const [searchQuery, setSearchQuery] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const { data: allItems = [] } = useQuery<Item[]>({
    queryKey: ['/api/items'],
    queryFn: () => api.items.getAll(),
  });

  const maintenanceItems = allItems.filter((item: Item) => item.status === 'Maintenance');

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) =>
      api.items.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setShowItemForm(false);
      setEditingItem(null);
      toast({ title: "Item updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update item", variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.items.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete item", variant: "destructive" });
    }
  });

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      onLogout();
    }
  };

  const filteredItems = maintenanceItems.filter((item: Item) => {
    const matchesSearch = searchQuery === "" ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleEditItem = (itemData: any) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: itemData });
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm(t('areYouSureDeleteItem'))) {
      deleteItemMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <InventoryHeader
        userName={userName}
        userRole={userRole}
        currentView="maintenance"
        language={language}
        onLanguageChange={onLanguageChange}
        onViewChange={(view) => {
          if (view === 'inventory' || view === 'categories') {
            onNavigateToInventory?.();
          }
        }}
        onLogout={handleLogout}
        onNavigateToReservations={onNavigateToReservations}
        onNavigateToActivityLogs={onNavigateToActivityLogs}
        onNavigateToQRCodes={onNavigateToQRCodes}
        onNavigateToMaintenance={() => {}}
        onNavigateToReports={onNavigateToReports}
      />

      <main className="max-w-[1400px] mx-auto px-5 py-8">
        <div className="text-center mb-10 p-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Wrench className="w-10 h-10" />
            <h1 className="text-4xl font-extrabold" data-testid="text-maintenance-title">
              {t('maintenanceManagement')}
            </h1>
          </div>
          <p className="text-lg opacity-90 max-w-2xl mx-auto" data-testid="text-maintenance-subtitle">
            {t('itemsInMaintenanceSubtitle')}
          </p>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-muted-foreground text-lg" data-testid="text-maintenance-count">
              {filteredItems.length} {t('itemsInMaintenanceCount')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
              variant="outline"
              data-testid="button-toggle-view"
            >
              {viewMode === 'card' ? <TableIcon className="w-4 h-4 mr-2" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
              {viewMode === 'card' ? t('table_view') : t('card_view')}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('search_maintenance_items')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
              data-testid="input-search-maintenance"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border-2 border-dashed">
            <Wrench className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2" data-testid="text-no-maintenance">
              {t('noItemsInMaintenance')}
            </h3>
            <p className="text-muted-foreground" data-testid="text-no-maintenance-subtitle">
              {t('allEquipmentWorking')}
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid gap-4">
            {filteredItems.map((item: Item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                barcode={item.barcode}
                productName={item.productName}
                productType={item.productType}
                status={item.status}
                location={item.location || undefined}
                notes={item.notes || undefined}
                userRole={userRole}
                onEdit={(userRole === 'admin' || userRole === 'developer') ? () => {
                  setEditingItem(item);
                  setShowItemForm(true);
                } : undefined}
                onDelete={(userRole === 'admin' || userRole === 'developer') ? () => handleDeleteItem(item.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('barcode')}</TableHead>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('location')}</TableHead>
                  <TableHead>{t('notes')}</TableHead>
                  {(userRole === 'admin' || userRole === 'developer') && <TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>{t('actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: Item) => (
                  <TableRow key={item.id} data-testid={`row-maintenance-item-${item.id}`}>
                    <TableCell className="font-mono" data-testid={`text-barcode-${item.id}`}>{item.barcode}</TableCell>
                    <TableCell className="font-medium" data-testid={`text-name-${item.id}`}>{item.productName}</TableCell>
                    <TableCell data-testid={`text-type-${item.id}`}>{item.productType}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800" data-testid={`badge-status-${item.id}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell data-testid={`text-location-${item.id}`}>{item.location || '-'}</TableCell>
                    <TableCell data-testid={`text-notes-${item.id}`}>{item.notes || '-'}</TableCell>
                    {(userRole === 'admin' || userRole === 'developer') && (
                      <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}>
                        <div className={`flex gap-2 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(item);
                              setShowItemForm(true);
                            }}
                            data-testid={`button-edit-${item.id}`}
                          >
                            {t('edit')}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {showItemForm && (
        <ItemFormDialog
          open={showItemForm}
          onClose={() => {
            setShowItemForm(false);
            setEditingItem(null);
          }}
          onSubmit={handleEditItem}
          item={editingItem || undefined}
          mode={editingItem ? 'edit' : 'add'}
          userRole="admin"
        />
      )}
    </div>
  );
}