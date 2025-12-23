import { Outlet, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { TenantSidebar } from './TenantSidebar';
import { LandlordSidebar } from './LandlordSidebar';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Determine which sidebar to render based on user role
  const renderSidebar = () => {
    if (user?.role === 'landlord') {
      return <LandlordSidebar />;
    }
    return <TenantSidebar />;
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {renderSidebar()}
        <SidebarInset className="flex-1">
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
