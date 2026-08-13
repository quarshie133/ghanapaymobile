import Shell from '@/components/layout/Shell';
import AdminProtectedRoute from '@/components/layout/AdminProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtectedRoute>
      <Shell isAdmin={true}>{children}</Shell>
    </AdminProtectedRoute>
  );
}
