import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DeliveryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { location: string; street: string; area: string; mapLink: string }) => void;
  initialData?: {
    location?: string;
    street?: string;
    area?: string;
    mapLink?: string;
  };
}

export default function DeliveryDialog({
  open,
  onClose,
  onSave,
  initialData
}: DeliveryDialogProps) {
  const [location, setLocation] = React.useState(initialData?.location || "");
  const [street, setStreet] = React.useState(initialData?.street || "");
  const [area, setArea] = React.useState(initialData?.area || "");
  const [mapLink, setMapLink] = React.useState(initialData?.mapLink || "");

  React.useEffect(() => {
    if (!open) {
      setLocation("");
      setStreet("");
      setArea("");
      setMapLink("");
    }
  }, [open]);

  const handleSave = () => {
    if (!location.trim()) {
      alert("Delivery Location is required");
      return;
    }
    onSave({
      location: location.trim(),
      street: street.trim(),
      area: area.trim(),
      mapLink: mapLink.trim()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Delivery Location *</Label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Building A, Studio 3"
              className="w-full border rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street">Street / Road</Label>
            <input
              id="street"
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="e.g., Al Corniche Street"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Area / District</Label>
            <input
              id="area"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g., West Bay, Lusail"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maplink">Google Maps Link (Optional)</Label>
            <input
              id="maplink"
              type="url"
              value={mapLink}
              onChange={(e) => setMapLink(e.target.value)}
              placeholder="Paste Google Maps link..."
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="button"
              className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
              onClick={handleSave}
            >
              Save Delivery Info
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
