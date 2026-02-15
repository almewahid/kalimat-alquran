import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { App as CapacitorApp } from '@capacitor/app'
import { supabaseClient } from '@/components/api/supabaseClient'

// ✅ معالجة Deep Link من Google OAuth
CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
  console.log('Deep Link received:', url);
  
  if (url.includes('access_token=') || url.includes('code=')) {
    try {
      // استخراج الـ tokens من الـ URL
      const urlObj = new URL(url);
      const hash = urlObj.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken) {
        // تسجيل الدخول في Supabase
        const { data, error } = await supabaseClient.supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          return;
        }

        if (data?.session) {
          console.log('Session created successfully');
          
          // إنشاء البروفايل إذا لم يكن موجوداً
          try {
            const { data: profile } = await supabaseClient.supabase
              .from('user_profiles')
              .select('user_id')
              .eq('user_id', data.session.user.id)
              .maybeSingle();

            if (!profile) {
              await supabaseClient.supabase.from('user_profiles').insert({
                user_id: data.session.user.id,
                email: data.session.user.email,
                full_name: data.session.user.user_metadata?.full_name || 'مستخدم',
                role: 'user',
              });

              await supabaseClient.supabase.from('user_gems').insert({
                user_id: data.session.user.id,
                user_email: data.session.user.email,
                total_gems: 0,
                gems_spent: 0,
                current_gems: 0,
              });
            }
          } catch (profileError) {
            console.error('Profile error:', profileError);
          }

          // التحويل للداشبورد
          window.location.href = '/Dashboard';
        }
      }
    } catch (error) {
      console.error('Deep Link error:', error);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)