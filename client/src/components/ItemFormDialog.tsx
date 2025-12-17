
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, EQUIPMENT_CATEGORIES, ITEM_STATUSES } from "@shared/schema";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";
import { useTranslation } from "@/lib/translations";
import type { Language } from "@/lib/translations";

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: any) => void;
  item?: {
    id?: string;
    barcode: string;
    productName: string;
    productNameAr?: string;
    productType: string;
    productTypeAr?: string;
    status: string;
    location?: string;
    notes?: string;
    isEquipment?: boolean;
    maintenanceAvailableDate?: string;
  };
  mode: 'add' | 'edit';
  userRole?: string;
  isEquipment?: boolean;
  language?: Language;
}

export default function ItemFormDialog({ open, onClose, onSubmit, item, mode, userRole, isEquipment = true, language = 'en' }: ItemFormDialogProps) {
  const t = useTranslation(language);
  const [formData, setFormData] = useState({
    barcode: item?.barcode || '',
    productName: item?.productName || '',
    productNameAr: item?.productNameAr || '',
    productType: item?.productType || '',
    productTypeAr: item?.productTypeAr || '',
    status: item?.status || 'Available',
    location: item?.location || '',
    notes: item?.notes || '',
    isEquipment: item?.isEquipment !== undefined ? item.isEquipment : isEquipment,
    maintenanceAvailableDate: item?.maintenanceAvailableDate || ''
  });

  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // Fetch categories based on item type to get custom subTypes
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories', isEquipment],
    queryFn: () => api.categories.getAll(isEquipment),
    enabled: open
  });

  // Get all subTypes ONLY from the API-returned categories (which are already filtered by isEquipment)
  // This ensures complete separation between Equipment and Assets
  const allSubTypes = categories
    .flatMap(cat => cat.subTypes);
  
  const uniqueSubTypes = Array.from(new Set(allSubTypes)).sort();
  
  console.log(`✅ ItemFormDialog (isEquipment=${isEquipment}):`, {
    categoriesCount: categories.length,
    subTypesCount: uniqueSubTypes.length,
    subTypes: uniqueSubTypes
  });

  useEffect(() => {
    if (item) {
      setFormData({
        barcode: item.barcode,
        productName: item.productName,
        productNameAr: item.productNameAr || '',
        productType: item.productType,
        productTypeAr: item.productTypeAr || '',
        status: item.status,
        location: item.location || '',
        notes: item.notes || '',
        isEquipment: item.isEquipment !== undefined ? item.isEquipment : isEquipment,
        maintenanceAvailableDate: item.maintenanceAvailableDate || ''
      });
    } else {
      setFormData({
        barcode: '',
        productName: '',
        productNameAr: '',
        productType: '',
        productTypeAr: '',
        status: 'Available',
        location: '',
        notes: '',
        isEquipment: isEquipment,
        maintenanceAvailableDate: ''
      });
    }
  }, [item, open, isEquipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddNewType = () => {
    if (newTypeName.trim()) {
      setFormData({ ...formData, productType: newTypeName.trim() });
      setNewTypeName('');
      setShowAddType(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid={`dialog-${mode}-item`}>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? t('addItem') : t('editItem')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">{t('barcode')} *</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g., CAM-001-2024"
                required
                data-testid="input-barcode"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productName">{t('productName')} (EN) *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g., Canon EOS R5"
                required
                data-testid="input-product-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productNameAr">{t('productName')} (AR)</Label>
              <Input
                id="productNameAr"
                value={formData.productNameAr}
                onChange={(e) => setFormData({ ...formData, productNameAr: e.target.value })}
                placeholder="e.g., كانون EOS R5"
                data-testid="input-product-name-ar"
                dir="rtl"
              />
            </div>
            <div className="space-y-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productType">{t('type')} (EN) *</Label>
              {mode === 'edit' ? (
                <div className="bg-muted p-2 rounded text-sm text-muted-foreground">
                  {formData.productType}
                </div>
              ) : !showAddType ? (
                <div className="space-y-2">
                  <Select
                    value={formData.productType}
                    onValueChange={(value) => {
                      if (value === '__add_new__') {
                        setShowAddType(true);
                      } else {
                        setFormData({ ...formData, productType: value });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-product-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSubTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                      {userRole === 'admin' && (
                        <SelectItem value="__add_new__" className="text-blue-600 font-medium">
                          <div className="flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Type
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Enter new product type"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewType();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleAddNewType}
                    disabled={!newTypeName.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddType(false);
                      setNewTypeName('');
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productTypeAr">{t('type')} (AR)</Label>
              {mode === 'edit' ? (
                <div className="bg-muted p-2 rounded text-sm text-muted-foreground" dir="rtl">
                  {formData.productTypeAr || 'Not specified'}
                </div>
              ) : (
                <Input
                  id="productTypeAr"
                  value={formData.productTypeAr}
                  onChange={(e) => setFormData({ ...formData, productTypeAr: e.target.value })}
                  placeholder="e.g., كاميرا"
                  data-testid="input-product-type-ar"
                  dir="rtl"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t('status')} *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.status === 'Maintenance' && (
            <div className="space-y-2">
              <Label htmlFor="maintenanceDate">{t('maintenanceAvailableDate')} *</Label>
              <Input
                id="maintenanceDate"
                type="date"
                value={formData.maintenanceAvailableDate}
                onChange={(e) => setFormData({ ...formData, maintenanceAvailableDate: e.target.value })}
                required={formData.status === 'Maintenance'}
                data-testid="input-maintenance-date"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">{t('location_label')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Studio A - Shelf 2"
              data-testid="input-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the item"
              rows={3}
              data-testid="textarea-notes"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
              data-testid="button-submit"
              disabled={!formData.barcode || !formData.productName || !formData.productType || !formData.status}
            >
              {mode === 'add' ? t('save') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
