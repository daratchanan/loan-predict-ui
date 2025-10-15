// ============================================
// app/page.tsx
// หน้าแรก - Redirect ไปหน้า Login
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        const isAdmin = user.roles.some(role => role.name === 'admin');
        if (isAdmin) {
          router.push('/admin');
        } else {
          router.push('/loan-officer');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">กำลังโหลด...</div>
    </div>
  );
}