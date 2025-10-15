
// ============================================
// middleware.ts
// Middleware สำหรับ redirect เท่านั้น (ไม่ตรวจสอบ token)
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow all paths - ให้ client-side ตรวจสอบ authentication
  // เพราะเราใช้ localStorage ไม่ใช่ cookies
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/loan-officer/:path*', '/login'],
};
