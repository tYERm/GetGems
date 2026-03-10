import { useEffect, useState } from 'react';
import { initTelegram } from './services/telegram';
import { trackVisitor } from './services/api';
import { isSynced as checkSynced } from './services/inventory';
import { AppContext, ViewType } from './store';
import { parseGiftId } from './constants';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import MarketView from './views/MarketView';
import MyGiftsView from './views/MyGiftsView';
import SeasonsView from './views/SeasonsView';
import ProfileView from './views/ProfileView';
import AuthView from './views/AuthView';
import DepositTonView from './views/DepositTonView';
import DepositStarsView from './views/DepositStarsView';
import GiftWelcomeView from './views/GiftWelcomeView';

export default function App() {
  const [currentView,  setCurrentView]  = useState<ViewType>('market');
  const [isSynced,     setIsSynced]     = useState(false);
  const [tonBalance,   setTonBalance]   = useState(0);
  const [starsBalance, setStarsBalance] = useState(0);
  const [giftId,       setGiftId]       = useState('');
  const [giftSlug,     setGiftSlug]     = useState('');
  const [giftNum,      setGiftNum]      = useState('');

  useEffect(() => {
    // Init Telegram SDK first so that initDataUnsafe is available
    initTelegram();

    // Read gift_id from URL
    const urlParams  = new URLSearchParams(window.location.search);
    const rawGiftId  = urlParams.get('gift_id') || '';

    // isSynced must be checked AFTER initTelegram() so the Telegram user ID
    // is available; otherwise it will always return false (fixed bug).
    // We use a small delay to give the SDK time to fully populate initDataUnsafe.
    const checkAndSetSync = () => {
      const synced = checkSynced();
      setIsSynced(synced);

      if (rawGiftId) {
        const parsed = parseGiftId(rawGiftId);
        setGiftId(rawGiftId);
        setGiftSlug(parsed.slug);
        setGiftNum(parsed.num);

        if (!synced) {
          setCurrentView('gift-welcome');
        }
        // If already synced, stay on market — gift context is set in state
      }
    };

    // Give Telegram WebApp 100 ms to finish loading initDataUnsafe
    const timer = setTimeout(checkAndSetSync, 100);

    trackVisitor();

    return () => clearTimeout(timer);
  }, []);

  const isAuthView        = currentView === 'registration';
  const isDepositView     = currentView === 'deposit-ton' || currentView === 'deposit-stars';
  const isGiftWelcomeView = currentView === 'gift-welcome';
  const showHeaderAndNav  = !isAuthView && !isDepositView && !isGiftWelcomeView;

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      isSynced,    setIsSynced,
      tonBalance,  setTonBalance,
      starsBalance, setStarsBalance,
      giftId,      setGiftId,
      giftSlug,    setGiftSlug,
      giftNum,     setGiftNum,
    }}>
      {/*
       * pb-[72px]: leave space at the bottom for the BottomNav so content
       * is never hidden behind it. 72px = nav height (64px) + 8px gap.
       */}
      <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden pb-[72px]">
        {showHeaderAndNav && <Header />}

        <main className="relative z-10 w-full h-full">
          {currentView === 'market'        && <MarketView />}
          {currentView === 'my-gifts'      && <MyGiftsView />}
          {currentView === 'seasons'       && <SeasonsView />}
          {currentView === 'profile'       && <ProfileView />}
          {currentView === 'registration'  && <AuthView />}
          {currentView === 'deposit-ton'   && <DepositTonView />}
          {currentView === 'deposit-stars' && <DepositStarsView />}
          {currentView === 'gift-welcome'  && <GiftWelcomeView />}
        </main>

        {showHeaderAndNav && <BottomNav />}
      </div>
    </AppContext.Provider>
  );
}
