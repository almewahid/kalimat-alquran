import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/components/api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = جاري التحقق، null = غير مسجّل، object = مسجّل
  const [user, setUser] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    let cancelled = false;

    const applyUser = async (authUser) => {
      if (!authUser) { setUser(null); return; }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, preferences')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (cancelled) return;
      setUser(authUser);
      setIsAdmin(profile?.role === 'admin');
      setPreferences(profile?.preferences || {});
    };

    // التحقق الأولي من الجلسة
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) applyUser(user ?? null);
    });

    // متابعة تغييرات حالة تسجيل الدخول/الخروج
    // يستخدم session.user مباشرةً بدلاً من استدعاء getUser() مجدداً
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        applyUser(session.user);
      } else {
        if (!cancelled) {
          setUser(null);
          setIsAdmin(false);
          setPreferences({});
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, preferences, isLoading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
