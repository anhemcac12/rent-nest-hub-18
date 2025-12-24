import { Outlet, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TenantSidebar } from './TenantSidebar';
import { LandlordSidebar } from './LandlordSidebar';
import { PropertyManagerSidebar } from './PropertyManagerSidebar';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const renderSidebar = () => {
    if (user?.role === 'landlord') {
      return <LandlordSidebar />;
    }
    if (user?.role === 'property_manager') {
      return <PropertyManagerSidebar />;
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
