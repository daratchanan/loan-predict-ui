// ============================================
// app/(admin)/admin/page.tsx
// Dashboard สำหรับ Admin (มีปุ่ม Retrain Model)
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const isAdmin = user.roles.some(role => role.name === 'admin');
      if (!isAdmin) {
        router.push('/loan-officer');
      }
    }
  }, [user, loading, router]);

  // แสดง loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  // แสดง loading ระหว่างรอ redirect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  const isAdmin = user.roles.some(role => role.name === 'admin');
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return <AdminDashboard />;
}