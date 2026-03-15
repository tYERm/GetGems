import { createContext, useContext } from 'react';

export type ViewType =
  | 'market'
  | 'my-gifts'
  | 'seasons'
  | 'profile'
  | 'registration'
  | 'deposit-ton'
  | 'deposit-stars'
  | 'gift-welcome'
  | 'sync-info';

interface AppState {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isSynced: boolean;
  setIsSynced: (synced: boolean) => void;
  tonBalance: number;
  setTonBalance: (balance: number) => void;
  starsBalance: number;
  setStarsBalance: (balance: number) => void;
  giftId: string;
  setGiftId: (id: string) => void;
  giftSlug: string;
  setGiftSlug: (slug: string) => void;
  giftNum: string;
  setGiftNum: (num: string) => void;
  // Откуда пришли на sync-info: 'auth' | 'modal' | null
  syncInfoReturnView: ViewType | null;
  setSyncInfoReturnView: (v: ViewType | null) => void;
}

export const AppContext = createContext<AppState | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}
