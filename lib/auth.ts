// ============================================
// lib/auth.ts
// ไฟล์สำหรับจัดการ Authentication
// ============================================

export const AUTH_COOKIE = 'auth_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('token');
}