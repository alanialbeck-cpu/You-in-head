import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const F = "'Segoe UI','Arial',sans-serif";

export function Auth({ onBack, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    setMessage('');
    setIsError(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) { setIsError(true); setMessage(error.message); }
    setBusy(false);
  }

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

        {/* Google */}
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#fff', border: '2px solid #4285F4', borderRadius: 4,
            color: '#222', fontSize: 10, padding: '10px 16px',
            fontFamily: F, cursor: 'pointer', letterSpacing: '0.05em', width: '100%',
          }}
          disabled={busy}
          onClick={handleGoogle}
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          ВОЙТИ ЧЕРЕЗ GOOGLE
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: '#2a1840' }} />
          <span style={{ fontSize: 8, color: '#3a2860' }}>ИЛИ</span>
          <div style={{ flex: 1, height: 1, background: '#2a1840' }} />
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
