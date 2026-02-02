import { createClient } from '@base44/sdk';

// Create a client WITHOUT authentication requirement
export const base44 = createClient({
  appId: "68b74ae8214aa5bfcb70e378", 
  requiresAuth: false // ✅ منع redirect لـ Base44 login
});