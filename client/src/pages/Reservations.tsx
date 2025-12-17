import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Plus, CheckCircle, XCircle, Clock, ArrowLeft, Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { api, type Reservation, type Item } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ReservationFormDialog from "@/components/ReservationFormDialog";
import ReservationActionDialog from "@/components/ReservationActionDialog";
import InventoryHeader from "@/components/InventoryHeader";
import type { Language } from "@/lib/translations";
import { useTranslation } from "@/lib/translations";

interface ReservationsPageProps {
  userName: string;
  userRole: string;
  userId: string;
  onLogout: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToActivityLogs?: () => void;
  onNavigateToQRCodes?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToReports?: () => void;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
}

export default function Reservations({ userName, userRole, userId, onLogout, onNavigateToInventory, onNavigateToActivityLogs, onNavigateToQRCodes, onNavigateToMaintenance, onNavigateToReports, language = 'en', onLanguageChange }: ReservationsPageProps) {
  const { toast } = useToast();
  const t = useTranslation(language);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: 'reject' | 'complete'; reservationId: string; itemName: string }>({ open: false, action: 'reject', reservationId: '', itemName: '' });

  const { data: reservations = [] } = useQuery({
    queryKey: ['/api/reservations'],
    queryFn: () => api.reservations.getAll(),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => api.items.getAll(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => api.users.getAll(),
  });

  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutReservation, setCheckoutReservation] = useState<any>(null);
  const [checkoutCondition, setCheckoutCondition] = useState<'good' | 'damage' | ''>("");
  const [checkoutNotes, setCheckoutNotes] = useState("");

  const createReservationMutation = useMutation({
    mutationFn: (data: any) => api.reservations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setShowReservationForm(false);
      toast({ title: "Reservation created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create reservation", variant: "destructive" });
    }
  });

  const updateReservationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.reservations.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({ title: "Reservation updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update reservation", variant: "destructive" });
    }
  });

  const handleApprove = (id: string) => {
    updateReservationMutation.mutate({
      id,
      data: { status: 'approved', approvalDate: new Date() }
    });
  };

  const handleReject = (id: string, itemId: string) => {
    const itemName = getItemName(itemId);
    setActionDialog({ open: true, action: 'reject', reservationId: id, itemName });
  };

  const handleComplete = (id: string, itemId: string) => {
    const itemName = getItemName(itemId);
    setActionDialog({ open: true, action: 'complete', reservationId: id, itemName });
  };

  const handleActionSubmit = (data: { rejectionReason?: string; itemConditionOnReturn?: string; returnCondition?: 'good' | 'damage' }) => {
    const updateData: any = {
      approvalDate: new Date()
    };

    if (actionDialog.action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejectionReason = data.rejectionReason;
    } else {
      updateData.status = 'completed';
      const reservation = reservations.find(r => r.id === actionDialog.reservationId);
      
      if (data.returnCondition === 'good') {
        updateData.itemConditionOnReturn = 'Equipment returned in good condition';
      } else if (data.returnCondition === 'damage') {
        const damageDescription = `Equipment returned with damage/missing items: ${data.itemConditionOnReturn}`;
        updateData.itemConditionOnReturn = damageDescription;
        
        // Create damage report for admin return inspection
        if (reservation) {
          api.damageReports.create({
            itemId: reservation.itemId,
            reportedBy: userId,
            reportType: 'admin-damage',
            severity: 'medium',
            description: damageDescription,
            status: 'open'
          }).catch(err => console.error('Failed to create return report:', err));
        }
      }
    }

    updateReservationMutation.mutate({
      id: actionDialog.reservationId,
      data: updateData
    });
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item?.productName || 'Unknown Item';
  };

  const getUserName = (userId: string) => {
    // Show the user ID - names will be resolved by backend
    return userId.substring(0, 8) + '...';
  };

  const handleCheckout = (reservation: any) => {
    setCheckoutReservation(reservation);
    setCheckoutCondition("");
    setCheckoutNotes("");
    setShowCheckoutDialog(true);
  };

  const handleConfirmCheckout = () => {
    if (!checkoutCondition) {
      toast({ title: "Please select equipment condition", variant: "destructive" });
      return;
    }
    if (checkoutCondition === 'damage' && !checkoutNotes.trim()) {
      toast({ title: "Please describe the damage or missing items", variant: "destructive" });
      return;
    }

    const conditionDescription = checkoutCondition === 'good' 
      ? 'Equipment received in good condition'
      : `Equipment received with damage/missing items: ${checkoutNotes.trim()}`;

    // Create damage report for user pickup
    if (checkoutCondition === 'damage') {
      api.damageReports.create({
        itemId: checkoutReservation.itemId,
        reportedBy: userId,
        reportType: 'user-damage',
        severity: 'medium',
        description: conditionDescription,
        status: 'open'
      }).catch(err => console.error('Failed to create report:', err));
    }

    updateReservationMutation.mutate({
      id: checkoutReservation.id,
      data: { 
        checkoutDate: new Date().toISOString(),
        itemConditionOnReceive: conditionDescription
      }
    });
    setShowCheckoutDialog(false);
  };

  const filteredReservations = reservations
    .filter(res => {
      const itemName = getItemName(res.itemId).toLowerCase();
      const matchesSearch = searchQuery === "" || itemName.includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "all" || res.status === filterStatus;
      const matchesUser = (userRole === 'admin' || userRole === 'developer') || res.userId === userId;
      return matchesSearch && matchesFilter && matchesUser;
    })
    .sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <InventoryHeader
        userName={userName}
        userRole={userRole}
        currentView="inventory"
        onViewChange={() => onNavigateToInventory?.()}
        onLogout={onLogout}
        onNavigateToActivityLogs={onNavigateToActivityLogs}
        onNavigateToQRCodes={onNavigateToQRCodes}
        onNavigateToMaintenance={onNavigateToMaintenance}
        onNavigateToReports={onNavigateToReports}
        hideViewToggle={true}
        language={language}
        onLanguageChange={onLanguageChange}
      />

      <main className="max-w-[1400px] mx-auto px-3 md:px-5 py-4 md:py-8">
        <div className="text-center mb-10 p-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl text-white">
          <h1 className="text-4xl font-extrabold mb-4">{t('equipmentReservations')}</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {t('requestManageReservations')}
          </p>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex gap-3">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
            >
              {t('all')}
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus("pending")}
            >
              {t('pending')}
            </Button>
            <Button
              variant={filterStatus === "approved" ? "default" : "outline"}
              onClick={() => setFilterStatus("approved")}
            >
              {t('approved')}
            </Button>
            <Button
              variant={filterStatus === "completed" ? "default" : "outline"}
              onClick={() => setFilterStatus("completed")}
            >
              {t('completed')}
            </Button>
          </div>
          <Button
            onClick={() => setShowReservationForm(true)}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('newReservation')}
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold">{getItemName(reservation.itemId)}</h3>
                    <Badge className={`${getStatusColor(reservation.status)} text-white`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(reservation.status)}
                        {reservation.status.toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>
                        <strong>{language === 'en' ? 'Employee' : 'الموظف'}:</strong> {getUserName(reservation.userId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>
                        <strong>{t('department')}:</strong> {allUsers.find(u => u.id === reservation.userId)?.department || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        <strong>{t('requested')}:</strong> {format(new Date(reservation.requestDate), "PPP")}
                      </span>
                    </div>
                    {reservation.purposeOfUse && (
                      <div className="col-span-2 text-muted-foreground">
                        <strong>{t('purpose')}:</strong> {reservation.purposeOfUse}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        <strong>{language === 'en' ? 'Pickup' : 'الاستلام'}:</strong> {format(new Date(reservation.startDate), "PPP")} {reservation.startTime || "09:00"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        <strong>{language === 'en' ? 'Return' : 'الإرجاع'}:</strong> {format(new Date(reservation.returnDate), "PPP")} {reservation.returnTime || "17:00"}
                      </span>
                    </div>
                    {reservation.approvalDate && (
                      <div className="text-muted-foreground">
                        <strong>{t('responded')}:</strong> {format(new Date(reservation.approvalDate), "PPP")}
                      </div>
                    )}
                    {reservation.notes && (
                      <div className="col-span-2 text-muted-foreground">
                        <strong>{t('notes')}:</strong> {reservation.notes}
                      </div>
                    )}
                    {reservation.deliveryRequired === 'yes' && (
                      <div className="col-span-2 border-t pt-3 mt-3 space-y-2">
                        <div className="font-semibold text-foreground mb-2">📍 {language === 'en' ? 'Delivery Information' : 'معلومات التوصيل'}</div>
                        <div className="text-muted-foreground">
                          <strong>{language === 'en' ? 'Location' : 'الموقع'}:</strong> {reservation.deliveryLocation}
                        </div>
                        {reservation.deliveryStreet && (
                          <div className="text-muted-foreground">
                            <strong>{language === 'en' ? 'Street' : 'الشارع'}:</strong> {reservation.deliveryStreet}
                          </div>
                        )}
                        {reservation.deliveryArea && (
                          <div className="text-muted-foreground">
                            <strong>{language === 'en' ? 'Area' : 'المنطقة'}:</strong> {reservation.deliveryArea}
                          </div>
                        )}
                        {reservation.googleMapLink && (
                          <div className="text-muted-foreground">
                            <a href={reservation.googleMapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {language === 'en' ? 'View on Google Maps →' : 'عرض على خرائط جوجل ←'}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {(userRole === 'admin' || userRole === 'developer') && reservation.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      onClick={() => handleApprove(reservation.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t('approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                      onClick={() => handleReject(reservation.id, reservation.itemId)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {t('decline')}
                    </Button>
                  </div>
                )}
                {reservation.status === 'approved' && (
                  <div className="flex gap-2 flex-col">
                    {(userRole !== 'admin' && userRole !== 'developer') && (() => {
                      const today = new Date();
                      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                      
                      const startDate = new Date(reservation.startDate);
                      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                      
                      const isPickupDay = todayStr === startDateStr;
                      const hasReceivedEquipment = reservation.checkoutDate || reservation.itemConditionOnReceive;
                      
                      if (hasReceivedEquipment) {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-gray-100 text-gray-600 border-gray-300 cursor-not-allowed"
                            disabled
                            title={language === 'en' ? 'Equipment already received' : 'تم استلام المعدات'}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {language === 'en' ? 'Equipment Received ✓' : 'تم الاستلام ✓'}
                          </Button>
                        );
                      }
                      
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          onClick={() => handleCheckout(reservation)}
                          disabled={!isPickupDay}
                          title={isPickupDay ? (language === 'en' ? 'Click to confirm receipt' : 'انقر للتأكيد') : `${language === 'en' ? 'Available on' : 'متاح في'} ${format(new Date(reservation.startDate), "MMM dd, yyyy")}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {language === 'en' ? 'Receive Equipment' : 'استلام المعدات'} {!isPickupDay && (language === 'en' ? '(Not Available)' : '(غير متاح)')}
                        </Button>
                      );
                    })()}
                    {(userRole === 'admin' || userRole === 'developer') && (() => {
                      // Admin can mark as returned if:
                      // - Equipment has been checked out (itemConditionOnReceive is set)
                      // - Not already marked as returned (itemConditionOnReturn is not set)
                      const hasCheckedOut = reservation.checkoutDate || reservation.itemConditionOnReceive;
                      const alreadyMarkedReturned = reservation.itemConditionOnReturn !== undefined;
                      
                      if (alreadyMarkedReturned) {
                        return null;
                      }
                      
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          onClick={() => handleComplete(reservation.id, reservation.itemId)}
                          disabled={!hasCheckedOut}
                          title={hasCheckedOut ? (language === 'en' ? 'Click to confirm return' : 'انقر لتأكيد الإرجاع') : (language === 'en' ? 'Equipment must be checked out first' : 'يجب استلام المعدات أولاً')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t('markReturned')} {!hasCheckedOut && (language === 'en' ? '(Not Available)' : '(غير متاح)')}
                        </Button>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">{t('noReservationsFound')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterStatus !== "all" ? t('tryChangingFilter') : t('createFirstReservation')}
            </p>
          </div>
        )}
      </main>

      <ReservationFormDialog
        open={showReservationForm}
        onClose={() => setShowReservationForm(false)}
        onSubmit={(data) => createReservationMutation.mutate({ ...data, userId: userId })} // Pass the actual userId
        items={items.filter(item => item.status !== 'Maintenance')}
      />

      <ReservationActionDialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ ...actionDialog, open: false })}
        onSubmit={handleActionSubmit}
        action={actionDialog.action}
        itemName={actionDialog.itemName}
      />

      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('confirmEquipmentPickup')}</DialogTitle>
          </DialogHeader>
          {checkoutReservation && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2 border border-blue-200 dark:border-blue-800">
                <div><strong>{t('equipment')}:</strong> {getItemName(checkoutReservation.itemId)}</div>
                <div><strong>{language === 'en' ? 'Pickup Date & Time' : 'تاريخ ووقت الاستلام'}:</strong> {format(new Date(checkoutReservation.startDate), "PPP")} {checkoutReservation.startTime || "09:00"}</div>
                <div><strong>{language === 'en' ? 'Return Date & Time' : 'تاريخ ووقت الإرجاع'}:</strong> {format(new Date(checkoutReservation.returnDate), "PPP")} {checkoutReservation.returnTime || "17:00"}</div>
                <div><strong>{t('purpose')}:</strong> {checkoutReservation.purposeOfUse}</div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">{t('equipmentCondition')}</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setCheckoutCondition('good')}>
                    <input 
                      type="radio" 
                      name="condition" 
                      value="good"
                      checked={checkoutCondition === 'good'}
                      onChange={() => setCheckoutCondition('good')}
                      className="w-4 h-4"
                    />
                    <Label className="cursor-pointer font-medium flex items-center gap-2 mb-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      {t('good')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setCheckoutCondition('damage')}>
                    <input 
                      type="radio" 
                      name="condition" 
                      value="damage"
                      checked={checkoutCondition === 'damage'}
                      onChange={() => setCheckoutCondition('damage')}
                      className="w-4 h-4"
                    />
                    <Label className="cursor-pointer font-medium flex items-center gap-2 mb-0">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      {t('damageOrMissing')}
                    </Label>
                  </div>
                </div>
              </div>

              {checkoutCondition === 'damage' && (
                <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <Label htmlFor="damage-notes" className="text-base font-semibold">{t('describeDamage')}</Label>
                  <Textarea
                    id="damage-notes"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    placeholder={t('describeDamageDetails')}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleConfirmCheckout}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                >
                  {t('confirmReceipt')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}