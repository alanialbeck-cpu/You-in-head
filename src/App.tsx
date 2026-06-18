import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import type { User } from '@supabase/supabase-js';

type Screen = 'menu' | 'game' | 'auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>('menu');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setScreen('menu');
  };

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100vw', height: '100vh', background: '#09050f',
      color: '#4a3070', fontFamily: "'Press Start 2P',monospace", fontSize: 11,
    }}>
      ЗАГРУЗКА...
    </div>
  );

  if (screen === 'auth') return (
    <Auth onBack={() => setScreen('menu')} onSuccess={() => setScreen('menu')} />
  );

  if (screen === 'game') return (
    <Game userEmail={user?.email} onSignOut={() => setScreen('menu')} />
  );

  return (
    <MainMenu
      user={user}
      onPlay={() => setScreen('game')}
      onAuth={() => setScreen('auth')}
      onSignOut={handleSignOut}
    />
  );
}
