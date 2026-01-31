import { createClient } from '@base44/sdk';

const isDevelopment = import.meta.env.DEV;

export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID || "68b74ae8214aa5bfcb70e378", 
  requiresAuth: !isDevelopment // تعطيل المصادقة في التطوير فقط
});