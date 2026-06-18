import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface LeaderRow { id: string; nickname: string; score: number }

interface Props {
  user: User | null;
  onPlay: () => void;
  onAuth: () => void;
  onSignOut: () => void;
}

const F = "'Press Start 2P','Courier New',monospace";

const rankColor = (i: number) =>
  i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#a090c8';

function btn(col: string, bg: string, size = 13): React.CSSProperties {
  return {
    background: bg, border: `2px solid ${col}`, borderRadius: 6,
    color: col, fontSize: size, padding: '12px 28px',
    fontFamily: F, cursor: 'pointer', letterSpacing: '0.08em',
    textShadow: `0 0 10px ${col}`, width: '100%', maxWidth: 280,
    display: 'block',
  };
}

export function MainMenu({ user, onPlay, onAuth, onSignOut }: Props) {
  const [showLB, setShowLB] = useState(false);
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loadingLB, setLoadingLB] = useState(false);

  const openLB = useCallback(async () => {
    setShowLB(true);
    setLoadingLB(true);
    const { data } = await supabase
      .from('leaderboard')
      .select('id,nickname,score')
      .order('score', { ascending: false })
      .limit(10);
    setRows((data as LeaderRow[]) ?? []);
    setLoadingLB(false);
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '100vw', height: '100vh', background: '#09050f',
      fontFamily: F, color: '#e0d0ff', overflow: 'hidden',
    }}>

      {/* фоновые звёзды */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            width: i % 7 === 0 ? 2 : 1,
            height: i % 7 === 0 ? 2 : 1,
            background: '#fff',
            opacity: 0.15 + (i % 5) * 0.08,
            borderRadius: '50%',
          }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* заголовок */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 10, color: '#a090c8', letterSpacing: '0.3em', marginBottom: 12 }}>
            ★ ★ ★
          </div>
          <div style={{
            fontSize: 'clamp(16px, 4vw, 24px)', color: '#ffb040',
            textShadow: '0 0 20px #ff8800, 0 0 40px #ff5500',
            lineHeight: 1.4, letterSpacing: '0.05em',
          }}>
            БЕЗГОЛОВЫЙ
          </div>
          <div style={{
            fontSize: 'clamp(16px, 4vw, 24px)', color: '#ffb040',
            textShadow: '0 0 20px #ff8800, 0 0 40px #ff5500',
            lineHeight: 1.4, letterSpacing: '0.05em',
          }}>
            ВСАДНИК
          </div>
          <div style={{ fontSize: 8, color: '#4a3070', marginTop: 10, letterSpacing: '0.25em' }}>
            ENDLESS RUNNER
          </div>
        </div>

        {/* основные кнопки */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
          {user ? (
            <button style={btn('#80ffb0', '#0a1a10', 14)} onClick={onPlay}>
              ▶ ИГРАТЬ
            </button>
          ) : (
            <>
              <button style={btn('#c880ff', '#180a30', 12)} onClick={onAuth}>
                ▶ ВОЙТИ И ИГРАТЬ
              </button>
              <button style={{ ...btn('#80ffb0', '#0a1a10', 10), opacity: 0.75 }} onClick={onPlay}>
                ИГРАТЬ КАК ГОСТЬ
              </button>
            </>
          )}
          <button style={btn('#a0c8ff', '#000a1a', 11)} onClick={openLB}>
            ★ ТАБЛИЦА ЛИДЕРОВ
          </button>
        </div>

        {/* аккаунт (только если вошёл) */}
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 8, color: '#6040a0', textAlign: 'center', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <button style={{ ...btn('#504070', 'transparent', 9), padding: '8px 20px' }} onClick={onSignOut}>
              ВЫЙТИ ИЗ АККАУНТА
            </button>
          </div>
        )}

        <div style={{ fontSize: 8, color: '#2a1840', marginTop: 4 }}>
          ПРОБЕЛ — ПРЫЖОК  ·  ЛКМ — УДАР
        </div>
      </div>

      {/* оверлей таблицы лидеров */}
      {showLB && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 20,
          background: 'rgba(6,3,14,0.96)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflowY: 'auto', padding: '40px 24px', boxSizing: 'border-box', gap: 16,
          fontFamily: F, color: '#e0d0ff',
        }}>
          <div style={{ color: '#ffb040', fontSize: 14, textShadow: '0 0 10px #ff8800' }}>
            ★ ТАБЛИЦА ЛИДЕРОВ ★
          </div>

          {loadingLB ? (
            <div style={{ color: '#6040a0', fontSize: 11 }}>ЗАГРУЗКА...</div>
          ) : (
            <table style={{ borderCollapse: 'collapse', fontSize: 10, width: '100%', maxWidth: 360 }}>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #2a1a4a' }}>
                    <td style={{ color: rankColor(i), padding: '8px 12px', width: 40 }}>#{i + 1}</td>
                    <td style={{ padding: '8px 8px', color: '#d0c0ff', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.nickname}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#80ffb0', textAlign: 'right' }}>
                      {r.score}M
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#4a3070', padding: 24, fontSize: 10 }}>
                      ЕЩЁ НЕТ ЗАПИСЕЙ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <button style={{ ...btn('#a0c8ff', '#000a1a', 10), maxWidth: 200, padding: '10px 20px' }} onClick={() => setShowLB(false)}>
            ✕ ЗАКРЫТЬ
          </button>
        </div>
      )}
    </div>
  );
}
