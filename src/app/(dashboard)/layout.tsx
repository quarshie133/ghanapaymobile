import Shell from "@/components/layout/Shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Shell isAdmin={false}>{children}</Shell>;
}
