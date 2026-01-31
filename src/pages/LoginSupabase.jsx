import React, { useState } from 'react';
import { supabaseClient } from '@/components/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function LoginSupabase() {
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
      // تسجيل الدخول باستخدام Supabase
      const { data, error: signInError } = await supabaseClient.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

      // التحويل إلى Dashboard بعد ثانيتين
      setTimeout(() => {
        window.location.href = createPageUrl('DashboardSupabase');
      }, 2000);

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
      // إنشاء حساب جديد
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
      const { data: profileData, error: profileError } = await supabaseClient.supabase
        .from('user_profiles')
        .insert([{
          user_id: signUpData.user.id,
          email: email,
          full_name: email.split('@')[0],
          role: 'user'
        }])
        .select()
        .single();

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
        window.location.href = createPageUrl('DashboardSupabase');
      }, 2000);

    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
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
            تسجيل الدخول (Supabase - تجريبي)
          </CardDescription>
          <Badge className="mt-2 bg-green-100 text-green-700 border-green-300 w-fit mx-auto">
            🟢 Powered by Supabase
          </Badge>
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

          {/* Quick Test Account */}
          <div className="mt-6 p-4 bg-accent/30 rounded-lg">
            <p className="text-sm font-medium mb-2">للاختبار السريع:</p>
            <div className="text-xs space-y-1 text-foreground/70">
              <p>📧 Email: osakr100@gmail.com</p>
              <p>🔑 Password: كلمة المرور التي أنشأتها</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full mt-3"
              onClick={() => {
                setEmail('osakr100@gmail.com');
              }}
            >
              تعبئة البيانات تلقائياً
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}