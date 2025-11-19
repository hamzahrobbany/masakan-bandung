import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAdminSessionFromCookies } from '@/lib/auth';

export default async function AdminProtected({ children }: { children: ReactNode }) {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    redirect('/admin/login');
  }
  return <>{children}</>;
}
