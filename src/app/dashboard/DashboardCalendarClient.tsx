"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

export function DashboardCalendarClient({ eventDates }: { eventDates: Date[] }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="w-full rounded-xl border border-white/10 bg-card/50 backdrop-blur-md shadow-lg p-4 text-white"
      modifiers={{
        hasEvent: eventDates,
      }}
      modifiersClassNames={{
        hasEvent: "bg-primary/20 text-primary font-bold underline decoration-primary underline-offset-4",
      }}
    />
  );
}
