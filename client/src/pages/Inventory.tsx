import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import InventoryHeader from "@/components/InventoryHeader";
import CategoryCard from "@/components/CategoryCard";
import ItemCard from "@/components/ItemCard";
import ItemFormDialog from "@/components/ItemFormDialog";
import QRScannerDialog from "@/components/QRScannerDialog";
import ScanResultDialog from "@/components/ScanResultDialog";
import CategoryFormDialog from "@/components/CategoryFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, FolderPlus, Pencil, Trash2, LayoutGrid, TableIcon, CheckCircle, AlertCircle, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { api, type Item, type CategoryWithCounts } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ReservationFormDialog from "@/components/ReservationFormDialog";
import type { Language } from "@/lib/translations";
import { useTranslation } from "@/lib/translations";
import { format } from "date-fns";

interface InventoryPageProps {
  userName: string;
  userRole: string;
  userId: string;
  onLogout: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToActivityLogs?: () => void;
  onNavigateToQRCodes?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToReports?: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  initialCategory?: string | null;
}

export default function Inventory({ userName, userRole, userId, onLogout, onNavigateToDashboard, onNavigateToReservations, onNavigateToActivityLogs, onNavigateToQRCodes, onNavigateToMaintenance, onNavigateToReports, currentLanguage, onLanguageChange, initialCategory }: InventoryPageProps) {
  const { toast } = useToast();
  const t = useTranslation(currentLanguage);
  const [currentView, setCurrentView] = useState<'categories' | 'inventory'>(initialCategory ? 'inventory' : 'categories');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showAssetsOption, setShowAssetsOption] = useState(true);
  const [reservingItem, setReservingItem] = useState<Item | null>(null);
  const [itemTypeFilter, setItemTypeFilter] = useState<'equipment' | 'assets'>('equipment');
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutReservation, setCheckoutReservation] = useState<any>(null);
  const [checkoutCondition, setCheckoutCondition] = useState<'good' | 'damage'>('good');
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReservation, setReturnReservation] = useState<any>(null);
  const [returnCondition, setReturnCondition] = useState<'good' | 'damage'>('good');
  const [returnNotes, setReturnNotes] = useState("");
  const [showLocationColumn, setShowLocationColumn] = useState(true);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const { data: permissions = {} } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/permissions', { credentials: 'include' });
        if (!response.ok) return { show_assets: true };
        return response.json();
      } catch {
        return { show_assets: true };
      }
    },
  });

  useEffect(() => {
    setShowAssetsOption(permissions.show_assets !== false);
  }, [permissions]);

  const { data: categories = [] } = useQuery<CategoryWithCounts[]>({
    queryKey: ['/api/categories', itemTypeFilter],
    queryFn: () => api.categories.getAll(itemTypeFilter === 'equipment')
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ['/api/items', selectedCategory, itemTypeFilter],
    queryFn: () => {
      console.log('Fetching items for category:', selectedCategory, 'type:', itemTypeFilter);
      return api.items.getAll(selectedCategory || undefined, itemTypeFilter === 'equipment') as Promise<Item[]>;
    },
    enabled: currentView === 'inventory'
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['/api/reservations'],
    queryFn: () => api.reservations.getAll(),
    enabled: currentView === 'inventory'
  });

  const createItemMutation = useMutation({
    mutationFn: (itemData: Partial<Item>) => api.items.create(itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setShowItemForm(false);
      toast({ title: "Item added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add item", variant: "destructive" });
    }
  });

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

  const scanMutation = useMutation({
    mutationFn: (barcode: string) => api.scan.process(barcode),
    onSuccess: (data) => {
      setScanResult(data);
      setShowQRScanner(false);
      setShowScanResult(true);
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: () => {
      setScanResult({
        success: false,
        error: 'Failed to process scan'
      });
      setShowQRScanner(false);
      setShowScanResult(true);
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: any) => api.customCategories.create(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setShowCategoryForm(false);
      toast({ title: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.customCategories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setShowCategoryForm(false);
      setEditingCategory(null);
      toast({ title: "Category updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.customCategories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    }
  });

  const createReservationMutation = useMutation({
    mutationFn: (data: any) => api.reservations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setReservingItem(null);
      toast({ title: "Reservation created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create reservation", variant: "destructive" });
      setReservingItem(null);
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

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Define category order for equipment section
  const equipmentCategoryOrder = [
    "Cameras",
    "Lens",
    "Tripods & Stands",
    "Grips",
    "Audio",
    "Lighting",
    "Studio Accessories",
    "Bags & Cases",
    "Batteries & Power",
    "Cables & Adapters",
    "Monitors & Displays",
    "Storage Devices"
  ];

  // Filter categories by both equipment type AND search query for complete separation
  const filteredCategories = categories.filter(cat => {
    // Only show categories matching the current equipment type filter
    if (itemTypeFilter === 'equipment' && cat.isCustom && !cat.isEquipment) return false;
    if (itemTypeFilter === 'assets' && cat.isCustom && cat.isEquipment) return false;

    // Then filter by search query
    return cat.name.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    // Sort equipment categories by defined order, keep assets in natural order
    if (itemTypeFilter === 'equipment') {
      const indexA = equipmentCategoryOrder.indexOf(a.name);
      const indexB = equipmentCategoryOrder.indexOf(b.name);
      const orderA = indexA >= 0 ? indexA : 999;
      const orderB = indexB >= 0 ? indexB : 999;
      return orderA - orderB;
    }
    return 0;
  });

  const handleAddItem = (itemData: any) => {
    createItemMutation.mutate(itemData);
  };

  const handleEditItem = (itemData: any) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: itemData });
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleScan = (barcode: string) => {
    scanMutation.mutate(barcode);
  };

  const handleAddCategory = (categoryData: any) => {
    // Add isEquipment flag based on current filter
    createCategoryMutation.mutate({
      ...categoryData,
      isEquipment: itemTypeFilter === 'equipment'
    });
  };

  const handleEditCategory = (categoryData: any) => {
    if (editingCategory?.id) {
      updateCategoryMutation.mutate({ 
        id: editingCategory.id, 
        data: {
          ...categoryData,
          isEquipment: itemTypeFilter === 'equipment'
        }
      });
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleReserveItem = (item: Item) => {
    setReservingItem(item);
  };

  const handleSubmitReservation = (data: any) => {
    createReservationMutation.mutate(data);
  };

  const handleCheckout = (item: Item) => {
    if (confirm(`Check out ${item.productName}?`)) {
      updateItemMutation.mutate({
        id: item.id,
        data: { status: 'In Use' }
      });
    }
  };

  const handleCheckin = (item: Item) => {
    if (confirm(`Check in ${item.productName}?`)) {
      updateItemMutation.mutate({
        id: item.id,
        data: { status: 'Available' }
      });
    }
  };

  const getItemName = (itemId: string) => {
    return items.find(item => item.id === itemId)?.productName || itemId;
  };

  const getApprovedReservationForPickup = (itemId: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return reservations.find(res => {
      if (res.itemId !== itemId || res.status !== 'approved') return false;
      if (res.checkoutDate || res.itemConditionOnReceive) return false;

      const startDate = new Date(res.startDate);
      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

      return todayStr === startDateStr;
    });
  };

  const handleReceiveEquipment = (item: Item) => {
    const reservation = getApprovedReservationForPickup(item.id);
    if (reservation) {
      setCheckoutReservation(reservation);
      setCheckoutCondition('good');
      setCheckoutNotes("");
      setShowCheckoutDialog(true);
    }
  };

  const handleConfirmCheckout = async () => {
    if (checkoutCondition === 'damage' && !checkoutNotes.trim()) {
      toast({ title: "Please describe the damage or missing items", variant: "destructive" });
      return;
    }

    try {
      await api.reservations.update(checkoutReservation.id, {
        checkoutDate: new Date().toISOString(),
        itemConditionOnReceive: checkoutCondition,
        damageNotes: checkoutNotes || undefined
      });

      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setShowCheckoutDialog(false);
      toast({ title: "Equipment receipt confirmed successfully" });
    } catch (error) {
      toast({ title: "Failed to confirm equipment receipt", variant: "destructive" });
    }
  };

  const getPendingReturnReservation = (itemId: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return reservations.find(res => {
      if (res.itemId !== itemId || res.status !== 'approved') return false;
      if (res.itemConditionOnReturn !== undefined) return false; // Already marked as returned

      // Check if return date has started (today >= returnDate)
      const returnDate = new Date(res.returnDate);
      const returnDateStr = `${returnDate.getFullYear()}-${String(returnDate.getMonth() + 1).padStart(2, '0')}-${String(returnDate.getDate()).padStart(2, '0')}`;

      return todayStr >= returnDateStr;
    });
  };

  const handleMarkReturned = (item: Item) => {
    const reservation = getPendingReturnReservation(item.id);
    if (reservation) {
      setReturnReservation(reservation);
      setReturnCondition('good');
      setReturnNotes("");
      setShowReturnDialog(true);
    }
  };

  const handleConfirmReturn = async () => {
    if (returnCondition === 'damage' && !returnNotes.trim()) {
      toast({ title: "Please describe the damage or missing items", variant: "destructive" });
      return;
    }

    try {
      await api.reservations.update(returnReservation.id, {
        status: 'completed',
        itemConditionOnReturn: returnCondition,
        returnNotes: returnNotes || undefined
      });

      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setShowReturnDialog(false);
      toast({ title: "Equipment return confirmed successfully" });
    } catch (error) {
      toast({ title: "Failed to confirm equipment return", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto px-3 md:px-5 py-4 md:py-8 w-full">
        {currentView === 'categories' ? (
          <div>
            <div className="text-center mb-10 p-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl text-white">
              <h1 className="text-4xl font-extrabold mb-4" data-testid="text-hero-title">
                {itemTypeFilter === 'equipment' ? t('equipmentCategories') : t('assetCategories')}
              </h1>
              <p className="text-lg opacity-90 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
                {t('browseInventory')}
              </p>
            </div>

            <div className="flex gap-2 justify-center mb-8">
              <Button
                onClick={() => setItemTypeFilter('equipment')}
                variant={itemTypeFilter === 'equipment' ? 'default' : 'outline'}
                data-testid="button-filter-equipment-categories"
                className={itemTypeFilter === 'equipment' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : ''}
              >
                {t('equipment')}
              </Button>
              {(userRole === 'admin' || userRole === 'developer' || showAssetsOption) && (
                <Button
                  onClick={() => setItemTypeFilter('assets')}
                  variant={itemTypeFilter === 'assets' ? 'default' : 'outline'}
                  data-testid="button-filter-assets-categories"
                  className={itemTypeFilter === 'assets' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : ''}
                >
                  {t('assets')}
                </Button>
              )}
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={t('searchCategories')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base border-2"
                    data-testid="input-search-categories"
                  />
                </div>
                {userRole !== 'user' && (
                  <Button
                    onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
                    variant="outline"
                    className="h-12"
                    data-testid="button-toggle-view"
                  >
                    {viewMode === 'card' ? <TableIcon className="w-4 h-4 mr-2" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
                    {viewMode === 'card' ? t('tableView') : t('cardView')}
                  </Button>
                )}
                {(userRole === 'admin' || userRole === 'developer') && (
                  <Button
                    onClick={() => {
                      setEditingCategory(null);
                      setShowCategoryForm(true);
                    }}
                    className="bg-gradient-to-r from-[#667eea] to-[#764ba2] h-12"
                    data-testid="button-add-category"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    {t('addCategory')}
                  </Button>
                )}
              </div>
            </div>

            {userRole === 'user' ? (
              <div className="w-full relative flex items-center gap-2">
                <Carousel
                  opts={{ align: "start", loop: true }}
                  className="w-full"
                  data-testid="carousel-categories"
                >
                  <div className="flex items-center gap-2">
                    {/* LEFT ARROW - Circular outline style */}
                    <CarouselPrevious
                      className="relative left-0 top-0 translate-y-0 h-10 w-10 
                                 bg-transparent border-2 border-gray-400 text-gray-400
                                 rounded-full hover:border-[#667eea] hover:text-[#667eea] 
                                 hover:scale-110 transition-all flex-shrink-0"
                      data-testid="button-carousel-prev"
                    />

                    <CarouselContent className="flex-1">
                      {filteredCategories.map((category) => (
                        <CarouselItem
                          key={category.name}
                          className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4"
                        >
                          <CategoryCard
                            {...category}
                            language={currentLanguage}
                            compactMode={true}
                            onClick={() => {
                              setSelectedCategory(category.name);
                              setCurrentView('inventory');
                              setItemTypeFilter(category.isEquipment ? 'equipment' : 'assets');
                            }}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>

                    {/* RIGHT ARROW - Circular outline style */}
                    <CarouselNext
                      className="relative right-0 top-0 translate-y-0 h-10 w-10 
                                 bg-transparent border-2 border-gray-400 text-gray-400
                                 rounded-full hover:border-[#667eea] hover:text-[#667eea] 
                                 hover:scale-110 transition-all flex-shrink-0"
                      data-testid="button-carousel-next"
                    />
                  </div>
                </Carousel>
              </div>

            ) : viewMode === 'card' ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-5">
                {filteredCategories.map((category) => (
                  <div key={category.name} className="relative group">
                    <CategoryCard
                      {...category}
                      language={currentLanguage}
                      onClick={() => {
                        console.log('Category clicked:', category.name, 'isEquipment:', category.isEquipment);
                        setSelectedCategory(category.name);
                        setCurrentView('inventory');
                        setItemTypeFilter(category.isEquipment ? 'equipment' : 'assets');
                      }}
                    />
                    {(userRole === 'admin' || userRole === 'developer') && category.isCustom && (
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Editing category:', category);
                            setEditingCategory(category);
                            setShowCategoryForm(true);
                          }}
                          className="bg-white/90 hover:bg-white shadow-md"
                          data-testid="button-edit-category"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                          className="bg-red-500/90 hover:bg-red-600 shadow-md"
                          data-testid="button-delete-category"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('type')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('totalItems')}</TableHead>
                      <TableHead>{t('available')}</TableHead>
                      {(userRole === 'admin' || userRole === 'developer') && <TableHead className="text-right">{t('actions')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow 
                        key={category.name}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setCurrentView('inventory');
                        }}
                      >
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.subTypes.join(', ')}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${category.availableCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {category.availableCount > 0 ? t('available') : t('allInUse')}
                          </span>
                        </TableCell>
                        <TableCell>{category.totalCount}</TableCell>
                        <TableCell>{category.availableCount}</TableCell>
                        {(userRole === 'admin' || userRole === 'developer') && (
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCategory(category);
                                  setShowCategoryForm(true);
                                }}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(category.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
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
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-inventory-title">
                  {selectedCategory || t('allItems')}
                </h1>
                <p className="text-muted-foreground" data-testid="text-inventory-count">
                  {filteredItems.length} {t('items')}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
                  variant="outline"
                  data-testid="button-toggle-view-items"
                >
                  {viewMode === 'card' ? <TableIcon className="w-4 h-4 mr-2" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
                  {viewMode === 'card' ? t('tableView') : t('cardView')}
                </Button>
                <Popover open={showColumnSettings} onOpenChange={setShowColumnSettings}>
                  <PopoverTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      data-testid="button-column-settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">{t('columnVisibility')}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label htmlFor="location-toggle" className="text-sm cursor-pointer">
                            {t('location')}
                          </label>
                          <Switch
                            id="location-toggle"
                            checked={showLocationColumn}
                            onCheckedChange={setShowLocationColumn}
                            data-testid="switch-location-column"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {(userRole === 'admin' || userRole === 'developer') && (
                  <>
                    {itemTypeFilter === 'equipment' && (
                      <Button
                        onClick={() => setShowQRScanner(true)}
                        variant="outline"
                        data-testid="button-scan-item"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {t('scanItem')}
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setEditingItem(null);
                        setShowItemForm(true);
                      }}
                      className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                      data-testid="button-add-item"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addItem')}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={t('searchItems')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                  data-testid="input-search-items"
                />
              </div>
            </div>

            {viewMode === 'card' ? (
              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    barcode={item.barcode}
                    productName={item.productName}
                    productNameAr={item.productNameAr}
                    productType={item.productType}
                    productTypeAr={item.productTypeAr}
                    status={item.status}
                    location={item.location || undefined}
                    notes={item.notes || undefined}
                    maintenanceAvailableDate={item.maintenanceAvailableDate || undefined}
                    userRole={userRole}
                    isEquipment={item.isEquipment}
                    language={currentLanguage}
                    onEdit={(userRole === 'admin' || userRole === 'developer') ? () => {
                      setEditingItem(item);
                      setShowItemForm(true);
                    } : undefined}
                    onScan={item.isEquipment && (userRole !== 'admin' && userRole !== 'developer') ? () => {
                      setShowQRScanner(true);
                    } : undefined}
                    onReserve={item.isEquipment && (userRole !== 'admin' && userRole !== 'developer') ? () => handleReserveItem(item) : undefined}
                    onCheckout={item.isEquipment && (userRole === 'admin' || userRole === 'developer') ? () => handleCheckout(item) : undefined}
                    onCheckin={item.isEquipment && (userRole === 'admin' || userRole === 'developer') ? () => handleCheckin(item) : undefined}
                    onReceiveEquipment={item.isEquipment && (userRole !== 'admin' && userRole !== 'developer') && getApprovedReservationForPickup(item.id) ? () => handleReceiveEquipment(item) : undefined}
                    onMarkReturned={item.isEquipment && (userRole === 'admin' || userRole === 'developer') && getPendingReturnReservation(item.id) ? () => handleMarkReturned(item) : undefined}
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
                      {showLocationColumn && <TableHead>{t('location')}</TableHead>}
                      {(userRole === 'admin' || userRole === 'developer') && <TableHead className="text-right">{t('actions')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.barcode}</TableCell>
                        <TableCell className="font-medium">
                          {currentLanguage === 'ar' && item.productNameAr ? item.productNameAr : item.productName}
                        </TableCell>
                        <TableCell>
                          {currentLanguage === 'ar' && item.productTypeAr ? item.productTypeAr : (t(item.productType as any) || item.productType)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Available' ? 'bg-green-100 text-green-800' :
                            item.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'Reserved' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {t(item.status as any) || item.status}
                          </span>
                        </TableCell>
                        {showLocationColumn && <TableCell>{item.location || '-'}</TableCell>}
                        {(userRole === 'admin' || userRole === 'developer') && (
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingItem(item);
                                  setShowItemForm(true);
                                }}
                              >
                                <Pencil className="w-3 h-3" />
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

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground" data-testid="text-no-items">
                  {t('noItemsFound')}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {userRole === 'user' && (
        <footer className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white mt-20">
          <div className="max-w-[1400px] mx-auto px-5 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Company Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-wide">Inventory System</h3>
                <p className="text-white/90 text-xs leading-relaxed max-w-xs">
                  Professional equipment and asset management solution for seamless operations
                </p>
              </div>

              {/* Contact Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold tracking-wide">Contact Us</h4>
                <div className="space-y-1.5">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-white/70 text-[10px] uppercase tracking-wider">General Inquiries</span>
                    <a 
                      href="mailto:info@company.com" 
                      className="text-white/95 hover:text-white transition-colors text-xs font-medium"
                    >
                      info@company.com
                    </a>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-white/70 text-[10px] uppercase tracking-wider">Technical Support</span>
                    <a 
                      href="mailto:support@company.com" 
                      className="text-white/95 hover:text-white transition-colors text-xs font-medium"
                    >
                      support@company.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Legal Links */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold tracking-wide">Legal</h4>
                <div className="space-y-1.5">
                  <a 
                    href="#" 
                    className="block text-white/95 hover:text-white transition-colors text-xs font-medium hover:translate-x-1 transform duration-200"
                  >
                    Privacy Policy
                  </a>
                  <a 
                    href="#" 
                    className="block text-white/95 hover:text-white transition-colors text-xs font-medium hover:translate-x-1 transform duration-200"
                  >
                    Terms of Service
                  </a>
                  <a 
                    href="#" 
                    className="block text-white/95 hover:text-white transition-colors text-xs font-medium hover:translate-x-1 transform duration-200"
                  >
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/25 mt-5 pt-3.5">
              <div className="flex justify-center items-center">
                <p className="text-white/80 text-xs text-center">
                  © {new Date().getFullYear()} Inventory System. All rights reserved.
                </p>
                <p className="text-white/70 text-[11px] text-center">
                  
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* WhatsApp Floating Button - Only for users */}
      {userRole === 'user' && (
        <a
          href="https://wa.me/97472250387"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          data-testid="button-whatsapp"
          title="Chat on WhatsApp"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* Category Form Dialog */}
      <CategoryFormDialog
        open={showCategoryForm}
        onClose={() => {
          setShowCategoryForm(false);
          setEditingCategory(null);
        }}
        onSubmit={editingCategory ? handleEditCategory : handleAddCategory}
        category={editingCategory}
        mode={editingCategory ? 'edit' : 'add'}
        isEquipment={itemTypeFilter === 'equipment'}
      />

      {/* Item Form Dialog */}
      <ItemFormDialog
        open={showItemForm}
        onClose={() => {
          setShowItemForm(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleEditItem : handleAddItem}
        item={editingItem}
        mode={editingItem ? 'edit' : 'add'}
        categories={categories}
        currentLanguage={currentLanguage}
      />

      {/* QR Scanner Dialog */}
      <QRScannerDialog
        open={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleScan}
      />

      {/* Scan Result Dialog */}
      <ScanResultDialog
        open={showScanResult}
        onClose={() => setShowScanResult(false)}
        result={scanResult}
      />

      {/* Reservation Form Dialog */}
      {reservingItem && (
        <ReservationFormDialog
          open={!!reservingItem}
          onClose={() => setReservingItem(null)}
          onSubmit={handleSubmitReservation}
          item={reservingItem}
          userId={userId}
        />
      )}

      {/* Checkout Condition Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmEquipmentReceipt')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('receiveEquipmentPrompt')} <strong>{getItemName(checkoutReservation?.itemId)}</strong>
            </p>
            <div className="space-y-3">
              <Label>{t('equipmentCondition')}</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={checkoutCondition === 'good' ? 'default' : 'outline'}
                  onClick={() => setCheckoutCondition('good')}
                  className={checkoutCondition === 'good' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('goodCondition')}
                </Button>
                <Button
                  type="button"
                  variant={checkoutCondition === 'damage' ? 'default' : 'outline'}
                  onClick={() => setCheckoutCondition('damage')}
                  className={checkoutCondition === 'damage' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {t('damageOrMissing')}
                </Button>
              </div>
            </div>
            {checkoutCondition === 'damage' && (
              <div className="space-y-2">
                <Label>{t('describeDamageDetails')}</Label>
                <Textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder={t('describeDamageDetails')}
                  className="min-h-[100px]"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleConfirmCheckout} className="bg-gradient-to-r from-[#667eea] to-[#764ba2]">
                {t('confirmReceipt')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Condition Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmEquipmentReturn')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('returnEquipmentPrompt')} <strong>{getItemName(returnReservation?.itemId)}</strong>
            </p>
            <div className="space-y-3">
              <Label>{t('equipmentCondition')}</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={returnCondition === 'good' ? 'default' : 'outline'}
                  onClick={() => setReturnCondition('good')}
                  className={returnCondition === 'good' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('goodCondition')}
                </Button>
                <Button
                  type="button"
                  variant={returnCondition === 'damage' ? 'default' : 'outline'}
                  onClick={() => setReturnCondition('damage')}
                  className={returnCondition === 'damage' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {t('damageOrMissing')}
                </Button>
              </div>
            </div>
            {returnCondition === 'damage' && (
              <div className="space-y-2">
                <Label>{t('describeDamageDetails')}</Label>
                <Textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder={t('describeDamageDetails')}
                  className="min-h-[100px]"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleConfirmReturn} className="bg-gradient-to-r from-[#667eea] to-[#764ba2]">
                {t('confirmReturn')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}