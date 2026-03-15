import { useEffect, useState, useRef } from 'react';
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
import SyncInfoView from './views/SyncInfoView';

// ── Floating particle background ──────────────────────────────────────────────
interface Particle { id: number; x: number; size: number; dur: number; delay: number; color: string; drift: number; }

function ParticleField() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const colors = ['rgba(35,130,255,', 'rgba(135,116,225,', 'rgba(255,255,255,'];
    const initial: Particle[] = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 2 + Math.random() * 3,
      dur: 7 + Math.random() * 10,
      delay: Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)] + (0.2 + Math.random() * 0.4) + ')',
      drift: (Math.random() - 0.5) * 80,
    }));
    setParticles(initial);
    counterRef.current = initial.length;

    const interval = setInterval(() => {
      const id = ++counterRef.current;
      const newP: Particle = {
        id,
        x: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        dur: 8 + Math.random() * 8,
        delay: 0,
        color: colors[Math.floor(Math.random() * colors.length)] + (0.15 + Math.random() * 0.35) + ')',
        drift: (Math.random() - 0.5) * 60,
      };
      setParticles(prev => [...prev.slice(-24), newP]);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            bottom: '-8px',
            width: p.size,
            height: p.size,
            background: p.color,
            '--dur': `${p.dur}s`,
            '--delay': `${p.delay}s`,
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
      {/* Ambient gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(35,130,255,0.06) 0%, transparent 70%)', animation: 'glow-pulse 6s ease-in-out infinite' }} />
      <div className="absolute top-2/3 right-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(135,116,225,0.07) 0%, transparent 70%)', animation: 'glow-pulse 8s ease-in-out infinite 2s' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentView,  setCurrentView]  = useState<ViewType>('market');
  const [isSynced,     setIsSynced]     = useState(false);
  const [tonBalance,   setTonBalance]   = useState(0);
  const [starsBalance, setStarsBalance] = useState(0);
  const [giftId,       setGiftId]       = useState('');
  const [giftSlug,     setGiftSlug]     = useState('');
  const [giftNum,      setGiftNum]      = useState('');
  const [syncInfoReturnView, setSyncInfoReturnView] = useState<any>(null);

  useEffect(() => {
    initTelegram();
    trackVisitor();

    const urlParams = new URLSearchParams(window.location.search);
    const rawGiftId = urlParams.get('gift_id') || '';

    let attempts = 0;
    const maxAttempts = 10;

    const resolve = () => {
      const tgUid = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
      if (!tgUid && attempts < maxAttempts) { attempts++; setTimeout(resolve, 100); return; }
      const synced = checkSynced();
      setIsSynced(synced);
      if (rawGiftId) {
        const parsed = parseGiftId(rawGiftId);
        setGiftId(rawGiftId);
        setGiftSlug(parsed.slug);
        setGiftNum(parsed.num);
        setCurrentView('gift-welcome');
      }
    };
    setTimeout(resolve, 100);
  }, []);

  const isAuthView        = currentView === 'registration';
  const isDepositView     = currentView === 'deposit-ton' || currentView === 'deposit-stars';
  const isGiftWelcomeView = currentView === 'gift-welcome';
  const isSyncInfoView    = currentView === 'sync-info';
  const showHeaderAndNav  = !isAuthView && !isDepositView && !isGiftWelcomeView && !isSyncInfoView;

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      isSynced,    setIsSynced,
      tonBalance,  setTonBalance,
      starsBalance, setStarsBalance,
      giftId,      setGiftId,
      giftSlug,    setGiftSlug,
      giftNum,     setGiftNum,
      syncInfoReturnView, setSyncInfoReturnView,
    }}>
      <div
        className="min-h-screen text-white overflow-x-hidden pb-[72px] relative"
        style={{
          backgroundColor: 'var(--bg)',
          paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))',
        }}
      >
        <ParticleField />
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
          {currentView === 'sync-info'      && <SyncInfoView />}
        </main>
        {showHeaderAndNav && <BottomNav />}
      </div>
    </AppContext.Provider>
  );
}
