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
    if (!loading && user) {
      const isAdmin = user.roles.some(role => role.name === 'admin');
      if (!isAdmin) {
        router.push('/loan-officer');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const isAdmin = user.roles.some(role => role.name === 'admin');
  if (!isAdmin) {
    return null;
  }

  return <AdminDashboard />;
}