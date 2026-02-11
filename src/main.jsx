import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { App as CapacitorApp } from '@capacitor/app'
import { supabaseClient } from '@/components/api/supabaseClient'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'

// ✅ تهيئة Google Auth (مهم جداً!)
GoogleAuth.initialize({
  clientId: '1096045632230-14dj83se3p0c9jdekcfhgprrhj7rgr2j.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});

// ✅ معالجة Deep Link من Google OAuth (مهم جداً!)
CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
  if (url.includes('access_token=') || url.includes('code=')) {
    try {
      await supabaseClient.supabase.auth.getSessionFromUrl({ url });
      const { data } = await supabaseClient.supabase.auth.getSession();
      if (data.session) {
        window.location.href = '/Dashboard';
      }
    } catch (error) {
      console.error('Deep Link error:', error);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)