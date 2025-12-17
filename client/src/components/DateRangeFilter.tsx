import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, startOfToday } from "date-fns";

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange) => void;
}

export default function DateRangeFilter({ onDateRangeChange }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>("all");
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const getDateRange = (range: string): DateRange | null => {
    const today = startOfToday();
    
    switch (range) {
      case "this-week": {
        const start = startOfWeek(today);
        const end = endOfWeek(today);
        return { startDate: start, endDate: end, label: "This Week" };
      }
      case "last-week": {
        const start = startOfWeek(subDays(today, 7));
        const end = endOfWeek(subDays(today, 7));
        return { startDate: start, endDate: end, label: "Last Week" };
      }
      case "this-month": {
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        return { startDate: start, endDate: end, label: "This Month" };
      }
      case "last-month": {
        const lastMonth = subDays(today, 30);
        const start = startOfMonth(lastMonth);
        const end = endOfMonth(lastMonth);
        return { startDate: start, endDate: end, label: "Last Month" };
      }
      default:
        return null;
    }
  };

  const handlePresetSelect = (range: string) => {
    setSelectedRange(range);
    const dateRange = getDateRange(range);
    if (dateRange) {
      onDateRangeChange(dateRange);
    }
  };

  const handleCustomRangeSubmit = () => {
    if (!customStart || !customEnd) {
      return;
    }
    
    const start = new Date(customStart);
    const end = new Date(customEnd);
    
    if (start > end) {
      return;
    }
    
    setSelectedRange("custom");
    onDateRangeChange({
      startDate: start,
      endDate: end,
      label: `${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}`,
    });
    setCustomOpen(false);
  };

  const handleClearFilter = () => {
    setSelectedRange("all");
    onDateRangeChange({
      startDate: new Date(0),
      endDate: new Date(Date.now() + 86400000),
      label: "All Time",
    });
  };

  const getDisplayLabel = () => {
    if (selectedRange === "all") return "All Time";
    if (selectedRange === "custom") return `${format(new Date(customStart), "MMM dd")} - ${format(new Date(customEnd), "MMM dd")}`;
    const range = getDateRange(selectedRange);
    return range?.label || "All Time";
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" data-testid="button-date-filter">
            <Calendar className="w-4 h-4" />
            {getDisplayLabel()}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handlePresetSelect("this-week")} data-testid="menu-item-this-week">
            This Week
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect("last-week")} data-testid="menu-item-last-week">
            Last Week
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect("this-month")} data-testid="menu-item-this-month">
            This Month
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect("last-month")} data-testid="menu-item-last-month">
            Last Month
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setCustomOpen(true)} data-testid="menu-item-custom-range">
            Custom Range
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleClearFilter} data-testid="menu-item-all-time">
            All Time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Range Dialog */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent data-testid="dialog-custom-date-range">
          <DialogHeader>
            <DialogTitle>Select Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                data-testid="input-custom-start-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                data-testid="input-custom-end-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomOpen(false)}
              data-testid="button-cancel-date-range"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomRangeSubmit}
              disabled={!customStart || !customEnd}
              data-testid="button-apply-date-range"
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
