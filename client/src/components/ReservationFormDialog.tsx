
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, Truck } from "lucide-react";
import { format } from "date-fns";
import { api, type Item } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DeliveryDialog from "@/components/DeliveryDialog";

interface ReservationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { itemId: string; startDate: Date; returnDate: Date; startTime?: string; returnTime?: string; purposeOfUse?: string; notes?: string; deliveryRequired?: string; deliveryLocation?: string; deliveryStreet?: string; deliveryArea?: string; googleMapLink?: string }) => void;
  items: Item[];
}

export default function ReservationFormDialog({
  open,
  onClose,
  onSubmit,
  items
}: ReservationFormDialogProps) {
  const [itemId, setItemId] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [returnTime, setReturnTime] = useState("17:00");
  const [purposeOfUse, setPurposeOfUse] = useState("");
  const [notes, setNotes] = useState("");
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [googleMapLink, setGoogleMapLink] = useState("");

  // Auto-select item if only one item is provided (from reserve button)
  useEffect(() => {
    if (open && items.length === 1) {
      setItemId(items[0].id);
    }
  }, [open, items]);

  // Fetch existing reservations for the selected item
  const { data: itemReservations = [] } = useQuery({
    queryKey: ['/api/reservations/item', itemId],
    queryFn: () => itemId ? api.reservations.getByItem(itemId) : Promise.resolve([]),
    enabled: !!itemId,
  });

  // Reset dates when item changes
  useEffect(() => {
    setStartDate(undefined);
    setReturnDate(undefined);
  }, [itemId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !startDate || !returnDate || !purposeOfUse) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (returnDate < startDate) {
      alert("Return date must be after start date");
      return;
    }
    
    // Send dates as YYYY-MM-DD strings to avoid timezone conversion
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const returnDateStr = `${returnDate.getFullYear()}-${String(returnDate.getMonth() + 1).padStart(2, '0')}-${String(returnDate.getDate()).padStart(2, '0')}`;
    
    onSubmit({
      itemId,
      startDate: startDateStr,
      returnDate: returnDateStr,
      startTime: startTime || undefined,
      returnTime: returnTime || undefined,
      purposeOfUse: purposeOfUse.trim(),
      notes: notes.trim() || undefined,
      deliveryRequired: hasDelivery ? 'yes' : 'no',
      deliveryLocation: deliveryLocation.trim() || undefined,
      deliveryStreet: deliveryStreet.trim() || undefined,
      deliveryArea: deliveryArea.trim() || undefined,
      googleMapLink: googleMapLink.trim() || undefined
    });
    
    setItemId("");
    setStartDate(undefined);
    setReturnDate(undefined);
    setStartTime("09:00");
    setReturnTime("17:00");
    setPurposeOfUse("");
    setNotes("");
    setHasDelivery(false);
    setDeliveryLocation("");
    setDeliveryStreet("");
    setDeliveryArea("");
    setGoogleMapLink("");
  };

  const handleClose = () => {
    setItemId("");
    setStartDate(undefined);
    setReturnDate(undefined);
    setStartTime("09:00");
    setReturnTime("17:00");
    setPurposeOfUse("");
    setNotes("");
    setHasDelivery(false);
    setDeliveryLocation("");
    setDeliveryStreet("");
    setDeliveryArea("");
    setGoogleMapLink("");
    onClose();
  };

  const handleDeliverySave = (data: { location: string; street: string; area: string; mapLink: string }) => {
    setDeliveryLocation(data.location);
    setDeliveryStreet(data.street);
    setDeliveryArea(data.area);
    setGoogleMapLink(data.mapLink);
    setHasDelivery(true);
    setShowDeliveryDialog(false);
  };

  // Check if a date is blocked by existing reservations
  const isDateBlocked = (date: Date) => {
    if (!itemId) return false;
    
    return itemReservations.some(reservation => {
      const resStart = new Date(reservation.startDate);
      const resEnd = new Date(reservation.returnDate);
      resStart.setHours(0, 0, 0, 0);
      resEnd.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= resStart && checkDate <= resEnd;
    });
  };

  // Check if selected dates conflict with existing reservations
  const hasDateConflict = () => {
    if (!startDate || !returnDate || !itemId) return false;

    return itemReservations.some(reservation => {
      const resStart = new Date(reservation.startDate);
      const resEnd = new Date(reservation.returnDate);
      
      return (
        (startDate >= resStart && startDate <= resEnd) ||
        (returnDate >= resStart && returnDate <= resEnd) ||
        (startDate <= resStart && returnDate >= resEnd)
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Reservation Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Select Item *</Label>
            <Select value={itemId} onValueChange={setItemId} required disabled={items.length === 1}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an item..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.productName} - {item.barcode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {items.length === 1 && (
              <p className="text-sm text-muted-foreground">
                Reserving: {items[0].productName}
              </p>
            )}
          </div>

          {itemId && itemReservations.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This item has {itemReservations.length} existing reservation(s). 
                Unavailable dates are highlighted in red on the calendar.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label>Pickup Date & Time *</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => {
                      const today = new Date(new Date().setHours(0, 0, 0, 0));
                      return date < today || isDateBlocked(date);
                    }}
                    modifiers={{
                      blocked: (date) => isDateBlocked(date)
                    }}
                    modifiersClassNames={{
                      blocked: "bg-red-100 text-red-900 line-through"
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Return Date & Time *</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, "PPP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={setReturnDate}
                    disabled={(date) => {
                      const today = new Date(new Date().setHours(0, 0, 0, 0));
                      if (startDate) {
                        return date < startDate || date < today || isDateBlocked(date);
                      }
                      return date < today || isDateBlocked(date);
                    }}
                    modifiers={{
                      blocked: (date) => isDateBlocked(date)
                    }}
                    modifiersClassNames={{
                      blocked: "bg-red-100 text-red-900 line-through"
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          {hasDateConflict() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The selected dates conflict with an existing reservation. Please choose different dates.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Use *</Label>
            <Textarea
              id="purpose"
              value={purposeOfUse}
              onChange={(e) => setPurposeOfUse(e.target.value)}
              placeholder="e.g., Q4 Advertising Campaign, Product Photography, etc."
              rows={2}
              required
            />
          </div>
          
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="delivery" 
                checked={hasDelivery}
                onChange={(e) => {
                  if (e.target.checked) {
                    setShowDeliveryDialog(true);
                  } else {
                    setHasDelivery(false);
                    setDeliveryLocation("");
                    setDeliveryStreet("");
                    setDeliveryArea("");
                    setGoogleMapLink("");
                  }
                }}
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="delivery" className="cursor-pointer flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Request Delivery
              </Label>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
              disabled={!itemId || !startDate || !returnDate || hasDateConflict()}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>

      <DeliveryDialog
        open={showDeliveryDialog}
        onClose={() => setShowDeliveryDialog(false)}
        onSave={handleDeliverySave}
        initialData={{
          location: deliveryLocation,
          street: deliveryStreet,
          area: deliveryArea,
          mapLink: googleMapLink
        }}
      />
    </Dialog>
  );
}
