import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, FileText, QrCode, Download, Pencil, Calendar, LogOut, LogIn, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation, getItemName, getItemType } from "@/lib/translations";

interface ItemCardProps {
  id: string;
  barcode: string;
  productName: string;
  productNameAr?: string;
  productType: string;
  productTypeAr?: string;
  status: string;
  location?: string;
  notes?: string;
  maintenanceAvailableDate?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onScan?: () => void;
  onReserve?: () => void;
  onCheckout?: () => void;
  onCheckin?: () => void;
  onReceiveEquipment?: () => void;
  onMarkReturned?: () => void;
  userRole: string;
  isEquipment?: boolean;
  language?: 'en' | 'ar';
}

const statusColors: Record<string, string> = {
  'Available': 'bg-green-600 hover:bg-green-700',
  'In Use': 'bg-amber-500 hover:bg-amber-600',
  'Reserved': 'bg-blue-600 hover:bg-blue-700',
  'Maintenance': 'bg-red-600 hover:bg-red-700'
};

export default function ItemCard({
  id,
  barcode,
  productName,
  productNameAr,
  productType,
  productTypeAr,
  status,
  location,
  notes,
  maintenanceAvailableDate,
  onEdit,
  onDelete,
  onScan,
  onReserve,
  onCheckout,
  onCheckin,
  onReceiveEquipment,
  onMarkReturned,
  userRole,
  language = 'en',
  isEquipment = true,
}: ItemCardProps) {
  const t = useTranslation(language);
  const displayName = getItemName(productName, productNameAr, language);
  const displayType = getItemType(productType, productTypeAr, language);
  const translatedStatus = t(status as any) || status;
  const [showQRDialog, setShowQRDialog] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const { data: qrData, isLoading: qrLoading } = useQuery({
    queryKey: ['/api/items', id, 'qrcode'],
    queryFn: () => api.qrCodes.getItemQRCode(id),
    enabled: showQRDialog,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500';
      case 'In Use':
        return 'bg-blue-500';
      case 'Reserved':
        return 'bg-amber-500';
      case 'Maintenance':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const downloadQRCode = () => {
    if (qrData?.qrCode) {
      const link = document.createElement('a');
      link.href = qrData.qrCode;
      link.download = `${barcode}-${productName}.png`;
      link.click();
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow" data-testid={`card-item-${id}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg" data-testid={`text-product-name-${id}`}>{displayName}</h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-barcode-${id}`}>{t('barcode')}: {barcode}</p>
          </div>
          <Badge
            className={`${statusColors[status]} text-white`}
            data-testid={`badge-status-${id}`}
          >
            {translatedStatus}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">{t('type')}:</span>
                <span className="ml-2 font-medium" data-testid={`text-type-${id}`}>{displayType}</span>
              </div>
              {location && (
                <div>
                  <span className="text-muted-foreground">{t('location')}:</span>
                  <span className="ml-2 font-medium" data-testid={`text-location-${id}`}>{location}</span>
                </div>
              )}
            </div>
            {notes && (
              <p className="text-sm text-muted-foreground" data-testid={`text-notes-${id}`}>
                <span className="font-medium">{t('notes_display')}</span> {notes}
              </p>
            )}

            {status === 'Maintenance' && maintenanceAvailableDate && (
              <div className="flex flex-col items-center justify-center py-4 px-2 bg-blue-50 dark:bg-blue-950 rounded-md text-center" data-testid={`maintenance-message-${id}`}>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">{t('maintenanceMessage')}</span>
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatDate(maintenanceAvailableDate)}</p>
              </div>
            )}

            {isEquipment ? (
              <>
                {userRole === 'admin' && (
                  <div className="flex gap-2 pt-2 flex-col">
                    {onMarkReturned && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onMarkReturned}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 w-full"
                        data-testid={`button-mark-returned-${id}`}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        {t('markReturned')}
                      </Button>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {status === 'Available' && (
                        <Button
                          onClick={onCheckout}
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 flex-1"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          {t('checkout')}
                        </Button>
                      )}
                      {status === 'In Use' && (
                        <Button
                          onClick={onCheckin}
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          {t('checkin')}
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowQRDialog(true)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Code
                      </Button>
                      <Button
                        onClick={onEdit}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
                {userRole !== 'admin' && (
                  <div className="flex gap-2 pt-2 flex-col">
                    {onReceiveEquipment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onReceiveEquipment}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 w-full"
                        data-testid={`button-receive-equipment-${id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Receive Equipment
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onScan}
                        className="flex-1"
                        data-testid={`button-scan-${id}`}
                        disabled={status !== 'Available' || !onScan}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        {status === 'Available' ? 'Scan to Checkout' : 'Not Available'}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={onReserve}
                        className="flex-1 bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                        data-testid={`button-reserve-${id}`}
                        disabled={status === 'Maintenance' || !onReserve}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Reserve
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {userRole === 'admin' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={onEdit}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border flex items-center justify-center">
              {qrLoading ? (
                <div className="w-64 h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Generating QR Code...</p>
                </div>
              ) : qrData?.qrCode ? (
                <img
                  src={qrData.qrCode}
                  alt={`QR Code for ${productName}`}
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <p className="text-muted-foreground text-red-500">Failed to load QR Code</p>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Barcode</p>
              <p className="font-mono font-semibold">{barcode}</p>
            </div>
            <Button
              onClick={downloadQRCode}
              className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2]"
              disabled={!qrData?.qrCode}
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}