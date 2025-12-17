
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ReservationActionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { rejectionReason?: string; itemConditionOnReturn?: string; returnCondition?: 'good' | 'damage' }) => void;
  action: 'reject' | 'complete';
  itemName: string;
}

export default function ReservationActionDialog({
  open,
  onClose,
  onSubmit,
  action,
  itemName
}: ReservationActionDialogProps) {
  const [reason, setReason] = useState("");
  const [returnCondition, setReturnCondition] = useState<'good' | 'damage' | ''>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action === 'reject') {
      onSubmit({ rejectionReason: reason.trim() || undefined });
    } else {
      if (!returnCondition) return;
      if (returnCondition === 'damage' && !reason.trim()) return;
      onSubmit({ 
        itemConditionOnReturn: reason.trim() || undefined,
        returnCondition 
      });
    }
    setReason("");
    setReturnCondition("");
    onClose();
  };

  if (action === 'complete') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mark Equipment as Returned</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                Item: <strong>{itemName}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Equipment Condition Upon Return *</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setReturnCondition('good')}>
                  <input 
                    type="radio" 
                    name="return-condition" 
                    value="good"
                    checked={returnCondition === 'good'}
                    onChange={() => setReturnCondition('good')}
                    className="w-4 h-4"
                  />
                  <Label className="cursor-pointer font-medium flex items-center gap-2 mb-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Good
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setReturnCondition('damage')}>
                  <input 
                    type="radio" 
                    name="return-condition" 
                    value="damage"
                    checked={returnCondition === 'damage'}
                    onChange={() => setReturnCondition('damage')}
                    className="w-4 h-4"
                  />
                  <Label className="cursor-pointer font-medium flex items-center gap-2 mb-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Damage or Missing
                  </Label>
                </div>
              </div>
            </div>

            {returnCondition === 'damage' && (
              <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <Label htmlFor="damage-notes" className="text-base font-semibold">Please describe the damage or missing items *</Label>
                <Textarea
                  id="damage-notes"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe what damage or items are missing..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setReason("");
                setReturnCondition("");
                onClose();
              }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="default"
                disabled={!returnCondition || (returnCondition === 'damage' && !reason.trim())}
              >
                Mark as Returned
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Rejection dialog (unchanged)
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Reservation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Item: <strong>{itemName}</strong>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setReason("");
              onClose();
            }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={!reason.trim()}
            >
              Reject Reservation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
