import Shell from '@/components/layout/Shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell isAdmin={true}>{children}</Shell>;
}
