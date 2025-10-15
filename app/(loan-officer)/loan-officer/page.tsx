// ============================================
// app/(loan-officer)/loan-officer/page.tsx
// Dashboard สำหรับ Loan Officer (ไม่มีปุ่ม Retrain Model)
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoanOfficerDashboard } from '@/components/dashboard/LoanOfficerDashboard';

export default function LoanOfficerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
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
    return null;
  }

  return <LoanOfficerDashboard />;
}