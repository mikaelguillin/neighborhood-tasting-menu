"use client";

import * as React from "react";

import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
}

function rangesEqual(a: DateRange | undefined, b: DateRange | undefined) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.from?.getTime() === b.from?.getTime() && a.to?.getTime() === b.to?.getTime();
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(() => {
    if (value) return value;
    const to = new Date();
    const from = subDays(to, 29);
    return { from, to };
  });

  // Sync the draft when the controlled `value` changes from outside (e.g. URL update).
  const lastSyncedValueRef = React.useRef<DateRange | undefined>(value);
  React.useEffect(() => {
    if (!rangesEqual(value, lastSyncedValueRef.current)) {
      lastSyncedValueRef.current = value;
      if (value) {
        setDraft(value);
      }
    }
  }, [value]);

  const handleDateChange = (nextValue: DateRange | undefined) => {
    let resolved = nextValue;

    // If the current draft is a complete range, treat the next click as the start
    // of a brand-new range instead of extending the existing one.
    if (draft?.from && draft?.to && nextValue) {
      const prevFromTime = draft.from.getTime();
      const prevToTime = draft.to.getTime();
      const candidates = [nextValue.from, nextValue.to].filter(
        (d): d is Date => d instanceof Date,
      );
      const clickedDate = candidates.find(
        (d) => d.getTime() !== prevFromTime && d.getTime() !== prevToTime,
      );

      if (clickedDate) {
        resolved = { from: clickedDate, to: undefined };
      }
    }

    setDraft(resolved);
    onChange?.(resolved);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" id="date" className="font-normal">
          {draft?.from
            ? draft.to
              ? `${format(draft.from, "d MMM yyyy")} - ${format(draft.to, "d MMM yyyy")}`
              : format(draft.from, "d MMM yyyy")
            : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="end">
        <Calendar
          mode="range"
          defaultMonth={draft?.from}
          selected={draft}
          onSelect={handleDateChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
