import React, { useState } from 'react';
import { supabaseClient } from '@/components/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: signInError } = await supabaseClient.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

      setTimeout(() => {
        window.location.href = createPageUrl('Dashboard');
      }, 1500);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: signUpData, error: signUpError } = await supabaseClient.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
          }
        }
      });

      if (signUpError) throw signUpError;

      // إنشاء سجل في user_profiles
      const { error: profileError } = await supabaseClient.supabase
        .from('user_profiles')
        .insert([{
          user_id: signUpData.user.id,
          email: email,
          full_name: email.split('@')[0],
          role: 'user'
        }]);

      if (profileError) throw profileError;

      // إنشاء سجل في user_progress
      await supabaseClient.supabase
        .from('user_progress')
        .insert([{
          user_id: signUpData.user.id,
          user_email: email,
        }]);

      // إنشاء سجل في user_gems
      await supabaseClient.supabase
        .from('user_gems')
        .insert([{
          user_id: signUpData.user.id,
          user_email: email,
          current_gems: 50,
          total_gems: 50
        }]);

      setSuccess('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');

      setTimeout(() => {
        window.location.href = createPageUrl('Dashboard');
      }, 1500);

    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabaseClient.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/Dashboard'
        }
      });
      
      if (error) throw error;
    } catch (err) {
      setError('فشل تسجيل الدخول بـ Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold gradient-text">
            كلمات القرآن
          </CardTitle>
          <CardDescription>
            تسجيل الدخول
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="text-left"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                كلمة المرور
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="text-left"
                dir="ltr"
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  أو
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              تسجيل الدخول بـ Google
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>

            {/* Signup Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignUp}
              disabled={loading}
            >
              إنشاء حساب جديد
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}