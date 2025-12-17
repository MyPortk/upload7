import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CategorySettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: { showQuantity: boolean; showLocation: boolean; showNotes: boolean }) => void;
  category?: any;
}

export default function CategorySettingsDialog({ open, onClose, onSave, category }: CategorySettingsDialogProps) {
  const [settings, setSettings] = useState({
    showQuantity: true,
    showLocation: true,
    showNotes: true
  });

  useEffect(() => {
    if (category) {
      setSettings({
        showQuantity: category.showQuantity ?? true,
        showLocation: category.showLocation ?? true,
        showNotes: category.showNotes ?? true
      });
    }
  }, [category, open]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-category-settings">
        <DialogHeader>
          <DialogTitle>Column Visibility Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which columns to display for items in the <strong>{category?.name}</strong> category
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="showQuantity"
                checked={settings.showQuantity}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, showQuantity: checked as boolean })
                }
                data-testid="checkbox-show-quantity"
              />
              <Label htmlFor="showQuantity" className="cursor-pointer">
                Show Quantity Column
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="showLocation"
                checked={settings.showLocation}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, showLocation: checked as boolean })
                }
                data-testid="checkbox-show-location"
              />
              <Label htmlFor="showLocation" className="cursor-pointer">
                Show Location Column
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="showNotes"
                checked={settings.showNotes}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, showNotes: checked as boolean })
                }
                data-testid="checkbox-show-notes"
              />
              <Label htmlFor="showNotes" className="cursor-pointer">
                Show Notes Column
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-settings">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-settings">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
