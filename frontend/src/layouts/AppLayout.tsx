import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { HabitModal } from '../components/HabitModal';
import { Plus } from 'lucide-react';
import { habitService, categoryService } from '../services/api';
import type { HabitCreateInput, Category } from '../types';
import { useToast } from '../components/Toast';

import { Footer } from '../components/Footer';

export const AppLayout: React.FC = () => {
  const { addToast } = useToast();
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const handleOpenNewHabit = async () => {
    try {
      const cats = await categoryService.getCategories();
      setCategories(cats);
    } catch {
      // fallback
    }
    setIsHabitModalOpen(true);
  };

  const handleCreateHabit = async (input: HabitCreateInput) => {
    try {
      await habitService.createHabit(input);
      addToast('success', 'Habit Created!', `"${input.name}" has been added to your daily routines.`);
      window.dispatchEvent(new Event('habit-updated'));
    } catch {
      addToast('error', 'Error Creating Habit', 'Could not save habit. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:bg-emerald-500/30 dark:selection:text-emerald-200">
      <Navbar
        onOpenNewHabit={handleOpenNewHabit}
      />

      <div className="flex-1 flex w-full">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 transition-all duration-200 pb-16 md:pb-0">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={handleOpenNewHabit}
        className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-600/30 dark:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
        title="Add New Routine"
        aria-label="Add New Routine"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      <MobileBottomNav />

      <HabitModal
        isOpen={isHabitModalOpen}
        categories={categories}
        onClose={() => setIsHabitModalOpen(false)}
        onSubmit={handleCreateHabit}
      />
    </div>
  );
};
