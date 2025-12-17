import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ScanResultDialogProps {
  open: boolean;
  onClose: () => void;
  result?: {
    success: boolean;
    productName?: string;
    barcode?: string;
    oldStatus?: string;
    newStatus?: string;
    action?: string;
    error?: string;
  };
  isLoading?: boolean;
}

export default function ScanResultDialog({ open, onClose, result, isLoading }: ScanResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center" data-testid="dialog-scan-result">
        <div className="py-6">
          {isLoading ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
              <h3 className="text-xl font-bold mb-2">Processing Scan...</h3>
              <p className="text-muted-foreground">Please wait</p>
            </>
          ) : result?.success ? (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-4" data-testid="icon-success" />
              <h3 className="text-xl font-bold mb-4">Scan Successful!</h3>
              <div className="space-y-2 text-left bg-muted/50 p-4 rounded-lg">
                <p data-testid="text-product-name">
                  <strong className="font-semibold">Product:</strong> {result.productName}
                </p>
                <p data-testid="text-barcode">
                  <strong className="font-semibold">Barcode:</strong> {result.barcode}
                </p>
                <p data-testid="text-status-change">
                  <strong className="font-semibold">Status:</strong> {result.oldStatus} → {result.newStatus}
                </p>
                <p data-testid="text-action">
                  <strong className="font-semibold">Action:</strong> {result.action}
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-600 mb-4" data-testid="icon-error" />
              <h3 className="text-xl font-bold mb-4">Scan Failed</h3>
              <p className="text-muted-foreground" data-testid="text-error">
                {result?.error || 'Unknown error occurred'}
              </p>
            </>
          )}

          {!isLoading && (
            <div className="flex gap-3 mt-6">
              <Button 
                className="flex-1"
                onClick={onClose}
                data-testid="button-scan-another"
              >
                Scan Another Item
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                data-testid="button-close"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
