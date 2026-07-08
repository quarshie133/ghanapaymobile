import Shell from "@/components/layout/Shell";
import DashboardProtectedRoute from "@/components/layout/DashboardProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProtectedRoute>
      <Shell isAdmin={false}>{children}</Shell>
    </DashboardProtectedRoute>
  );
}
