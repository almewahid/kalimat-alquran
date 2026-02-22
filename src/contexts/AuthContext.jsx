import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/components/api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = جاري التحقق، null = غير مسجّل، object = مسجّل
  const [user, setUser] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUser(null); return; }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      setUser(user);
      setIsAdmin(profile?.role === 'admin');
      setPreferences(profile?.preferences || {});
    };

    init();

    // متابعة تغييرات حالة تسجيل الدخول/الخروج
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        setPreferences({});
      } else {
        init();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, preferences, isLoading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
