import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const F = "'Press Start 2P','Courier New',monospace";

export function Auth({ onBack, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { setIsError(true); setMessage(error.message); }
        else if (data.session) { onSuccess(); }
        else { setMessage('Готово! Проверь почту для подтверждения.'); }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setIsError(true); setMessage(error.message); }
        else { onSuccess(); }
      }
    } catch {
      setIsError(true);
      setMessage('Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#120828', border: '1px solid #4a2080', borderRadius: 4,
    color: '#e0d0ff', fontSize: 10, padding: '11px 14px',
    fontFamily: F, outline: 'none', width: '100%',
    boxSizing: 'border-box', letterSpacing: '0.05em',
  };

  function btnStyle(col: string, bg: string, size = 11): React.CSSProperties {
    return {
      background: bg, border: `1px solid ${col}`, borderRadius: 4,
      color: col, fontSize: size, padding: '11px 20px',
      fontFamily: F, cursor: 'pointer', letterSpacing: '0.05em',
      textShadow: `0 0 8px ${col}`, width: '100%',
    };
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100vw', height: '100vh', background: '#09050f', fontFamily: F,
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        width: 300, padding: 32,
        background: '#0d0820', border: '1px solid #3a1860', borderRadius: 8,
      }}>

        <div style={{ color: '#ffb040', fontSize: 12, textAlign: 'center', textShadow: '0 0 10px #ff8800', marginBottom: 4 }}>
          {mode === 'signin' ? '◄ ВХОД ►' : '◄ РЕГИСТРАЦИЯ ►'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 8, color: '#6040a0' }}>EMAIL</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 8, color: '#6040a0' }}>ПАРОЛЬ</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="минимум 6 символов"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
              minLength={6}
              required
            />
          </div>

          <button type="submit" style={btnStyle('#80ffb0', '#0a1a10')} disabled={busy}>
            {busy ? '...' : mode === 'signin' ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}
          </button>
        </form>

        {message && (
          <div style={{
            color: isError ? '#ff6060' : '#80ffb0',
            fontSize: 9, textAlign: 'center', lineHeight: 1.9,
          }}>
            {message}
          </div>
        )}

        <button
          style={{ ...btnStyle('#a090c8', 'transparent', 8), padding: '9px 14px' }}
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}
        >
          {mode === 'signin' ? 'НЕТ АККАУНТА? РЕГИСТРАЦИЯ' : 'УЖЕ ЕСТЬ АККАУНТ? ВОЙТИ'}
        </button>

        <button style={{ ...btnStyle('#3a2860', 'transparent', 8), padding: '9px 14px' }} onClick={onBack}>
          ← НАЗАД В МЕНЮ
        </button>
      </div>
    </div>
  );
}
