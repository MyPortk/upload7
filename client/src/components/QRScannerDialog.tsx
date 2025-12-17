import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Keyboard } from "lucide-react";

interface QRScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function QRScannerDialog({ open, onClose, onScan }: QRScannerDialogProps) {
  const [manualBarcode, setManualBarcode] = useState("");
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');

  useEffect(() => {
    if (!open) {
      setManualBarcode("");
      setScanMode('camera');
    }
  }, [open]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-qr-scanner">
        <DialogHeader>
          <DialogTitle>Scan Item QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={scanMode === 'camera' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setScanMode('camera')}
              data-testid="button-mode-camera"
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera Scan
            </Button>
            <Button
              variant={scanMode === 'manual' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setScanMode('manual')}
              data-testid="button-mode-manual"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
          </div>

          {scanMode === 'camera' ? (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center p-6">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Camera preview would appear here
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: QR scanning requires camera permissions
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Position the QR code within the frame to scan
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-barcode">Enter Barcode</Label>
                <Input
                  id="manual-barcode"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g., CAM-001-2024"
                  autoFocus
                  data-testid="input-manual-barcode"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={!manualBarcode.trim()}
                data-testid="button-submit-barcode"
              >
                Process Barcode
              </Button>
            </form>
          )}

          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
            data-testid="button-cancel-scan"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
