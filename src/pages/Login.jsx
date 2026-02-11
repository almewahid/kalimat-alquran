import React, { useState } from 'react';
import { supabaseClient } from '@/components/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await supabaseClient.supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // إنشاء user profile
          const { error: profileError } = await supabaseClient.supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              email: email,
              full_name: email.split('@')[0],
              role: 'user',
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          // إنشاء user gems
          const { error: gemsError } = await supabaseClient.supabase
            .from('user_gems')
            .insert({
              user_id: data.user.id,
              user_email: email,
              total_gems: 0,
              gems_spent: 0,
              current_gems: 0,
            });

          if (gemsError) {
            console.error('Gems creation error:', gemsError);
          }

          window.location.href = '/Dashboard';
        }
      } else {
        const { error } = await supabaseClient.supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        window.location.href = '/Dashboard';
      }
    } catch (err) {
      console.error('Full error:', err);
      setError(err.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google Sign-In الصحيح
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // ✅ للتطبيق (Android/iOS) - استخدم signInWithIdToken
        const googleUser = await GoogleAuth.signIn();
        
        if (!googleUser || !googleUser.authentication) {
          throw new Error('فشل تسجيل الدخول بـ Google');
        }

        const { data, error } = await supabaseClient.supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.authentication.idToken,
        });

        if (error) throw error;

        // إنشاء profile إذا لم يكن موجوداً
        const { data: existingProfile } = await supabaseClient.supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (!existingProfile) {
          await supabaseClient.supabase.from('user_profiles').insert({
            user_id: data.user.id,
            email: data.user.email,
            full_name: googleUser.name || data.user.email.split('@')[0],
            role: 'user',
          });

          await supabaseClient.supabase.from('user_gems').insert({
            user_id: data.user.id,
            user_email: data.user.email,
            total_gems: 0,
            gems_spent: 0,
            current_gems: 0,
          });
        }

        window.location.href = '/Dashboard';
      } else {
        // ✅ للويب - استخدم signInWithOAuth
        const { error } = await supabaseClient.supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/Dashboard',
          },
        });

        if (error) throw error;
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'فشل تسجيل الدخول بـ Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-amber-950 dark:to-gray-900 p-4">
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200/30 dark:bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-2 border-amber-200 dark:border-amber-800">
        <CardHeader className="space-y-4 text-center pb-8">
          {/* الشعار - الصورة */}
          <div className="mx-auto">
            <img 
              src="/logo.png" 
              alt="كلمات القرآن" 
              className="w-32 h-32 mx-auto object-contain drop-shadow-2xl animate-in zoom-in duration-500"
            />
          </div>
          
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
              كلمات القرآن
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isSignUp ? 'إنشاء حساب جديد' : 'مرحباً بعودتك'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pr-10 h-12"
                  disabled={loading}
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 h-12"
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            {/* زر التسجيل */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  {isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
                </>
              )}
            </Button>
          </form>

          {/* الفاصل */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            متابعة مع Google
          </Button>

          {/* تبديل بين تسجيل دخول وإنشاء حساب */}
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-amber-700 hover:text-amber-800 font-medium hover:underline dark:text-amber-500 dark:hover:text-amber-400"
              disabled={loading}
            >
              {isSignUp ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}