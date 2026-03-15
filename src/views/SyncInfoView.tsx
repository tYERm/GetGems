import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Users, Zap, TrendingUp, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../store';
import { hapticImpact } from '../services/telegram';

const REASONS = [
  { icon: ShieldCheck, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', title: 'Верификация личности',
    text: 'Синхронизация подтверждает, что вы — реальный человек с настоящим Telegram-аккаунтом. Это исключает ботов и фейков из маркетплейса.' },
  { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: 'Защита от скама',
    text: 'Все продавцы и покупатели проходят верификацию. Вы можете быть уверены, что сделка безопасна и NFT-подарок реален.' },
  { icon: TrendingUp, color: '#2382ff', bg: 'rgba(35,130,255,0.12)', title: 'Доступ к полному функционалу',
    text: 'Без синхронизации недоступны покупка, продажа, офферы и история сделок. Верифицированные пользователи получают все возможности маркета.' },
  { icon: Users, color: '#8774e1', bg: 'rgba(135,116,225,0.12)', title: 'Чистое сообщество',
    text: 'Маркетплейс работает только с реальными пользователями Telegram. Это поддерживает честные цены и здоровую экосистему NFT.' },
  { icon: Lock, color: '#ec4899', bg: 'rgba(236,72,153,0.12)', title: 'Безопасность сделок',
    text: 'Синхронизированный аккаунт получает криптографически защищённую сессию. Ваши активы надёжно привязаны к вашему Telegram ID.' },
  { icon: Zap, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', title: 'Мгновенные уведомления',
    text: 'После синхронизации вы моментально получаете уведомления о новых офферах, изменениях цен и статусе ваших сделок.' },
];

export default function SyncInfoView() {
  const { setCurrentView, syncInfoReturnView, setSyncInfoReturnView } = useAppContext();

  const fromAuth = syncInfoReturnView === 'registration';

  const handleBack = () => {
    hapticImpact('light');
    setSyncInfoReturnView(null);
    setCurrentView(fromAuth ? 'registration' : 'market');
  };

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #0d0d12 0%, #0f0f16 60%, #0c0c10 100%)',
               paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))' }}>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(35,130,255,0.1) 0%, transparent 70%)', filter: 'blur(32px)', zIndex: 0 }} />

      {/* Back button — always visible */}
      <motion.button
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        onClick={handleBack}
        className="fixed w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        style={{
          top: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px) + 16px)',
          left: 16,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 10,
        }}
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </motion.button>

      <div className="relative z-10 flex flex-col items-center px-5 pt-20 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 flex items-center justify-center mb-5">
            {[0, 1].map(i => (
              <div key={i} className="absolute inset-0 rounded-full"
                style={{ border: '1.5px solid rgba(35,130,255,0.3)', animation: `ripple-out 3s ease-out ${i * 1.2}s infinite` }} />
            ))}
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(35,130,255,0.2), rgba(135,116,225,0.2))', border: '1px solid rgba(35,130,255,0.3)' }}>
              <ShieldCheck className="w-7 h-7 text-[#2382ff]" />
            </div>
          </div>
          <h1 className="text-[24px] font-bold text-white text-center mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Зачем нужна синхронизация?
          </h1>
          <p className="text-[14px] text-gray-400 text-center leading-relaxed max-w-xs">
            GetGems — верифицированный маркетплейс NFT-подарков Telegram. Без синхронизации торговля невозможна.
          </p>
        </motion.div>

        {/* Reason cards */}
        <div className="w-full flex flex-col gap-3 max-w-sm">
          {REASONS.map((r, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              className="flex gap-4 rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: r.bg }}>
                <r.icon className="w-5 h-5" style={{ color: r.color }} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-white mb-1">{r.title}</span>
                <span className="text-[13px] text-gray-400 leading-relaxed">{r.text}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="w-full max-w-sm mt-5 rounded-2xl p-4 flex justify-around"
          style={{ background: 'rgba(35,130,255,0.07)', border: '1px solid rgba(35,130,255,0.18)' }}>
          {[{ val: '196K+', label: 'Пользователей' }, { val: '100%', label: 'Верифицировано' }, { val: '0', label: 'Скамов' }]
            .map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[18px] font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{s.val}</span>
                <span className="text-[11px] text-gray-400 mt-0.5">{s.label}</span>
              </div>
            ))}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
          className="w-full max-w-sm mt-6 flex flex-col gap-3">
          {fromAuth ? (
            <button onClick={handleBack}
              className="w-full text-white font-bold py-4 rounded-2xl active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2382ff, #8774e1)', boxShadow: '0 4px 20px rgba(35,130,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>
              <CheckCircle2 className="w-4 h-4" />
              Понятно, синхронизировать
            </button>
          ) : (
            <button onClick={handleBack}
              className="w-full font-semibold py-4 rounded-2xl active:scale-[0.97] transition-transform flex items-center justify-center gap-2 text-[15px]"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ArrowLeft className="w-4 h-4" />
              Вернуться назад
            </button>
          )}
          <p className="text-[12px] text-gray-600 text-center">
            GetGems не хранит ваши данные — синхронизация используется только для верификации личности
          </p>
        </motion.div>
      </div>
    </div>
  );
}
