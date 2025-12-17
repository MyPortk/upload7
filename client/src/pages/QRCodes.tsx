import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import InventoryHeader from "@/components/InventoryHeader";
import { useToast } from "@/hooks/use-toast";
import type { Language } from "@/lib/translations";
import { useTranslation } from "@/lib/translations";

interface QRCodesProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToActivityLogs?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToReports?: () => void;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  currentLanguage?: Language;
}

export default function QRCodes({ userName, userRole, onLogout, onNavigateToInventory, onNavigateToReservations, onNavigateToActivityLogs, onNavigateToMaintenance, onNavigateToReports, language = 'en', onLanguageChange, currentLanguage = 'en' }: QRCodesProps) {
  const { toast } = useToast();
  const lang: Language = language || currentLanguage || 'en';
  const t = useTranslation(lang);
  const { data: qrCodes = [], isLoading } = useQuery({
    queryKey: ['/api/qrcodes/all'],
    queryFn: () => api.qrCodes.getAllQRCodes(),
  });

  const downloadQRCode = (qrCode: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${fileName}.png`;
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "URL copied to clipboard!" });
  };

  const downloadAllQRCodes = () => {
    qrCodes.forEach((item: any, index: number) => {
      setTimeout(() => {
        downloadQRCode(item.qrCode, `${item.barcode}-${item.productName}`);
      }, index * 100);
    });
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
        onNavigateToQRCodes={() => {}}
        onNavigateToMaintenance={onNavigateToMaintenance}
        onNavigateToReports={onNavigateToReports}
        hideViewToggle={true}
        language={lang}
        onLanguageChange={onLanguageChange || (() => {})}
      />

      <main className="max-w-[1400px] mx-auto px-5 py-8">
        <div className="text-center mb-10 p-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl text-white">
          <h1 className="text-4xl font-extrabold mb-4" data-testid="text-qrcodes-title">
            {t('qrCodes')}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto" data-testid="text-qrcodes-subtitle">
            {t('scanQRCodes')}
          </p>
        </div>

        <div className="flex items-center justify-end mb-6">
          <div className="flex gap-2">
            <Button
              onClick={downloadAllQRCodes}
              variant="outline"
              disabled={qrCodes.length === 0}
              className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-0"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('downloadAll')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('generatingQRCodes')}</p>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('noItemsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {qrCodes.map((item: any) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.productName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.barcode}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <img
                      src={item.qrCode}
                      alt={`QR Code for ${item.productName}`}
                      className="w-full h-auto"
                    />
                  </div>

                  {item.publicUrl && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Public Scan URL:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.publicUrl}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs bg-muted rounded border text-muted-foreground"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(item.publicUrl)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(item.publicUrl, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => downloadQRCode(item.qrCode, `${item.barcode}-${item.productName}`)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('downloadQRCode')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}