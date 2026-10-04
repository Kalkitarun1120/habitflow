import React from 'react';
import { HabitCalendar } from '../components/HabitCalendar/HabitCalendar';

export const CalendarPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      <HabitCalendar initialView="month" />
    </div>
  );
};
