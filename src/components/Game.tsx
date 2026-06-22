import { useEffect, useRef, useCallback, useState } from 'react';
import { startGame } from '../game/engine';
import { supabase } from '../lib/supabase';
import { censorText } from '../lib/censor';

const PUMPKIN_SYSTEM = `Ты — говорящая тыква. Ты голова Безголового всадника, горишь изнутри оранжевым огнём.
Пиши ТОЛЬКО на русском языке. Отвечай ОЧЕНЬ коротко: максимум 1-2 предложения.
Говори в характере мрачновато-весёлого тыквенного духа — жуткий, но верный своему всаднику.`;

const W = 320, H = 180;
const FONT = "'Segoe UI','Arial',sans-serif";
const BEST_KEY = 'headless_best';
const NICK_KEY = 'headless_nick';

interface LeaderRow { id: string; nickname: string; score: number }

interface Props {
  userEmail?: string;
  onSignOut: () => void;
}

export function Game({ onSignOut }: Props) {
  const cvRef      = useRef<HTMLCanvasElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
const gameRef    = useRef<ReturnType<typeof startGame> | null>(null);

  const [scale, setScale]             = useState(1);
  const [showLB, setShowLB]           = useState(false);
  const [finalScore, setFinalScore]   = useState(0);
  const [lbMode, setLbMode]           = useState<'death' | 'menu'>('death');
  const [nickname, setNickname]       = useState('');
  const [insertedId, setInsertedId]   = useState<string | null>(null);
  const [nickSaving, setNickSaving]   = useState(false);
  const [nickSaved, setNickSaved]     = useState(false);
  const [rows, setRows]               = useState<LeaderRow[]>([]);
  const [myRank, setMyRank]           = useState<number | null>(null);
  const [loadingLB, setLoadingLB]     = useState(false);
  const [pumpkinMsg, setPumpkinMsg]   = useState<string | null>(null);
  const [typedMsg, setTypedMsg]       = useState<string>('');
  const [subVisible, setSubVisible]   = useState(false);
  const pumpkinHideRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  const getBest  = useCallback(() => parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10), []);
  const saveBest = useCallback((n: number) => { localStorage.setItem(BEST_KEY, String(n)); }, []);

  useEffect(() => {
    function resize() {
      const cv = cvRef.current; const wrap = wrapRef.current;
      if (!cv || !wrap) return;
      const s = Math.min(window.innerWidth / W, window.innerHeight / H);
      setScale(s);
      cv.style.width  = `${window.innerWidth}px`;
      cv.style.height = `${window.innerHeight}px`;
      wrap.style.width  = `${window.innerWidth}px`;
      wrap.style.height = `${window.innerHeight}px`;
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLB(true);
    const { data } = await supabase
      .from('leaderboard')
      .select('id,nickname,score')
      .order('score', { ascending: false })
      .limit(50);
    setRows((data as LeaderRow[]) ?? []);
    setLoadingLB(false);
  }, []);

  const onDeath = useCallback((score: number) => {
    const savedNick = localStorage.getItem(NICK_KEY) || 'ГОСТЬ';
    setLbMode('death');
    setFinalScore(score);
    setNickname(savedNick);
    setInsertedId(null);
    setMyRank(null);
    setNickSaved(false);
    setShowLB(true);
    fetchLeaderboard();

    // автоматически записываем результат
    supabase
      .from('leaderboard')
      .insert({ nickname: savedNick, score })
      .select('id')
      .single()
      .then(({ data }) => {
        setInsertedId(data?.id ?? null);
        // считаем место игрока
        supabase
          .from('leaderboard')
          .select('*', { count: 'exact', head: true })
          .gt('score', score)
          .then(({ count }) => setMyRank((count ?? 0) + 1));
        fetchLeaderboard();
      });
  }, [fetchLeaderboard]);

  const onOpenLeaderboard = useCallback(() => {
    setLbMode('menu');
    setShowLB(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onPumpkinSpeak = useCallback(async (info: { event: string; distance: number; hp: number; maxHp: number; isJoke: boolean }) => {
    const { distance, hp, maxHp, isJoke } = info;
    const prompt = isJoke
      ? `Всадник проехал ${distance}м, у него ${hp}/${maxHp} HP. Пошути над ним — мягко и немного злорадно.`
      : `Всадник проехал ${distance}м, у него ${hp}/${maxHp} HP. Подбодри его!`;
    try {
      const { data } = await supabase.functions.invoke('ai', { body: { prompt, system: PUMPKIN_SYSTEM } });
      const text: string = data?.text;
      if (!text) return;

      // Сбросить предыдущее
      if (pumpkinHideRef.current) clearTimeout(pumpkinHideRef.current);
      if (typingRef.current) clearInterval(typingRef.current);

      const full = text.trim();
      setPumpkinMsg(full);
      setTypedMsg('');
      setSubVisible(true);

      // Печатать посимвольно
      let i = 0;
      typingRef.current = setInterval(() => {
        i++;
        setTypedMsg(full.slice(0, i));
        if (i >= full.length) {
          if (typingRef.current) clearInterval(typingRef.current);
          typingRef.current = null;
        }
      }, 35);

      // Скрыть через 7 сек
      pumpkinHideRef.current = setTimeout(() => {
        setSubVisible(false);
        setTimeout(() => { setPumpkinMsg(null); setTypedMsg(''); }, 400);
      }, 7000);
    } catch { /* тихо игнорируем ошибки AI */ }
  }, []);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const game = startGame(cv, getBest, saveBest, onDeath, onOpenLeaderboard, onPumpkinSpeak);
    gameRef.current = game;
    return game.stop;
  }, [getBest, saveBest, onDeath, onOpenLeaderboard, onPumpkinSpeak]);

  // обновить ник в уже записанной строке
  const handleUpdateNick = async () => {
    const newNick = censorText(nickname.trim()).slice(0, 20);
    if (!newNick || !insertedId) return;
    setNickSaving(true);
    localStorage.setItem(NICK_KEY, newNick);
    await supabase.from('leaderboard').update({ nickname: newNick }).eq('id', insertedId);
    await fetchLeaderboard();
    setNickSaved(true);
    setNickSaving(false);
  };

  const handleRestart = () => {
    setShowLB(false);
    gameRef.current?.restart();
  };


  const px = (n: number) => `${n * scale}px`;
  const rankColor = (i: number) =>
    i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#a090c8';

  const btnStyle = (col: string, bg: string): React.CSSProperties => ({
    background: bg, border: `${px(1)} solid ${col}`, borderRadius: px(2),
    color: col, fontSize: px(5), padding: `${px(3)} ${px(5)}`,
    fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '0.05em',
    textShadow: `0 0 ${px(3)} ${col}`,
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100vw', height:'100vh', background:'#09050f', overflow:'hidden' }}>
      <div ref={wrapRef} style={{ position:'relative' }}>
        <canvas
          ref={cvRef}
          width={W} height={H}
          style={{ display:'block', imageRendering:'pixelated', cursor:'crosshair', filter:'saturate(1.4) contrast(1.08) brightness(1.03)' }}
        />

        {pumpkinMsg && !showLB && (
          <div style={{
            position:'absolute', left:0, right:0, bottom:px(10),
            display:'flex', justifyContent:'center', alignItems:'flex-end',
            pointerEvents:'none', zIndex:10,
            opacity: subVisible ? 1 : 0,
            transition:'opacity 0.4s ease',
          }}>
            <div style={{
              background:'rgba(4,1,10,0.88)',
              border:`${px(1)} solid rgba(239,138,28,0.6)`,
              borderRadius:px(3),
              padding:`${px(3)} ${px(8)}`,
              maxWidth:px(290),
              color:'#ffd84a',
              fontSize:px(5),
              fontFamily:FONT,
              lineHeight:1.9,
              textAlign:'center',
              wordBreak:'break-word',
              boxShadow:`0 0 ${px(14)} rgba(239,138,28,0.4), inset 0 0 ${px(6)} rgba(255,180,0,0.05)`,
              letterSpacing:'0.04em',
              textShadow:`0 0 ${px(6)} #ef8a1c`,
            }}>
              {'🎃 '}{typedMsg}
            </div>
          </div>
        )}

        {showLB && (
          <div style={{
            position:'absolute', inset:0,
            background:'rgba(6,3,14,0.93)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start',
            overflowY:'auto', fontFamily:FONT,
            color:'#e0d0ff', padding:`${px(8)} ${px(6)}`,
            boxSizing:'border-box', gap:px(4), fontSize:px(5), lineHeight:'1.7',
          }}>

            <div style={{ color:'#ffb040', fontSize:px(7), textAlign:'center', textShadow:`0 0 ${px(4)} #ff8800` }}>
              ★ ТАБЛИЦА ЛИДЕРОВ ★
            </div>

            {lbMode === 'death' && (
              <>
                <div style={{ color:'#80ffb0', fontSize:px(6), textAlign:'center' }}>
                  ТВОЙ ПУТЬ: {finalScore}M
                </div>

                {myRank !== null && (
                  <div style={{ color:'#ffb040', fontSize:px(5), textAlign:'center' }}>
                    ТЫ #{myRank} В ТАБЛИЦЕ!
                  </div>
                )}

                {/* ник — изменить */}
                <div style={{ display:'flex', gap:px(3), alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
                  <input
                    style={{
                      background:'#1a0d33', border:`${px(1)} solid #6030b0`, borderRadius:px(2),
                      color:'#fff', fontSize:px(5), padding:`${px(3)} ${px(4)}`,
                      fontFamily:'inherit', outline:'none', width:px(80), letterSpacing:'0.05em',
                    }}
                    maxLength={20}
                    placeholder="НИК"
                    value={nickname}
                    onChange={e => { setNickname(e.target.value); setNickSaved(false); }}
                    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') handleUpdateNick(); }}
                  />
                  <button
                    style={btnStyle(nickSaved ? '#ffb040' : '#80ffb0', '#0a2a18')}
                    disabled={nickSaving || !nickname.trim() || !insertedId}
                    onClick={handleUpdateNick}
                  >
                    {nickSaving ? '...' : nickSaved ? 'СОХРАНЕНО!' : 'ИЗМЕНИТЬ НИК'}
                  </button>
                  <button style={btnStyle('#ffb040', '#1a0a00')} onClick={handleRestart}>
                    ▶ ИГРАТЬ СНОВА
                  </button>
                </div>
              </>
            )}

            {loadingLB ? (
              <div style={{ color:'#6040a0' }}>ЗАГРУЗКА...</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:px(4) }}>
                <thead>
                  <tr>
                    <th style={{ color:'#6040a0', padding:`${px(1)} ${px(3)}`, textAlign:'left', fontWeight:'normal', fontSize:px(3.5), borderBottom:`${px(1)} solid #2a1a4a` }}>#</th>
                    <th style={{ color:'#6040a0', padding:`${px(1)} ${px(2)}`, textAlign:'left', fontWeight:'normal', fontSize:px(3.5), borderBottom:`${px(1)} solid #2a1a4a` }}>НИК</th>
                    <th style={{ color:'#6040a0', padding:`${px(1)} ${px(3)}`, textAlign:'right', fontWeight:'normal', fontSize:px(3.5), borderBottom:`${px(1)} solid #2a1a4a` }}>М</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom:`${px(1)} solid #2a1a4a` }}>
                      <td style={{ color:rankColor(i), padding:`${px(2)} ${px(3)}`, width:px(18) }}>#{i+1}</td>
                      <td style={{ padding:`${px(2)} ${px(2)}`, color: r.id === insertedId ? '#ffff80' : '#d0c0ff', maxWidth:px(90), overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {r.nickname}{r.id === insertedId ? ' ◄' : ''}
                      </td>
                      <td style={{ padding:`${px(2)} ${px(3)}`, color:'#80ffb0', textAlign:'right' }}>
                        {r.score}M
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign:'center', color:'#4a3070', padding:px(6) }}>
                        ЕЩЁ НЕТ ЗАПИСЕЙ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {lbMode === 'menu' && (
              <button style={btnStyle('#a0c8ff', '#000a1a')} onClick={() => setShowLB(false)}>
                ✕ ЗАКРЫТЬ
              </button>
            )}
          </div>
        )}
<button
          onClick={onSignOut}
          style={{ position:'absolute', top:px(4), right:px(4), padding:`${px(2)} ${px(5)}`, background:'rgba(4,1,12,0.75)', border:`1px solid #3a2060`, borderRadius:px(2), color:'#5a4888', fontSize:px(4), cursor:'pointer', fontFamily:FONT, zIndex:20 }}
        >
          ВЫЙТИ
        </button>
      </div>
    </div>
  );
}
