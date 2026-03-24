"use client";
import React, { useEffect, useState } from 'react';
import { SidebarNav } from './sidebar-nav';
import { HeaderBar } from './header-bar';
import { useAppStore } from '@/lib/store';
import { MolecularFilterOverlay } from '@/components/molecular';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const hydrateFromStorage = useAppStore(s => s.hydrateFromStorage);
  const molecularFilterOpen = useAppStore(s => s.molecularFilterOpen);
  const setMolecularFilterOpen = useAppStore(s => s.setMolecularFilterOpen);

  useEffect(() => {
    hydrateFromStorage();
    setMounted(true);
  }, [hydrateFromStorage]);

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-2xl font-bold tracking-tight text-orange">STRATIS</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderBar />
        <main className="flex-1 overflow-hidden relative">
          {molecularFilterOpen ? (
            <MolecularFilterOverlay onClose={() => setMolecularFilterOpen(false)} />
          ) : (
            <div className="h-full overflow-auto p-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
