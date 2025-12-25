import { Outlet, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { TenantSidebar } from './TenantSidebar';
import { LandlordSidebar } from './LandlordSidebar';
import { PropertyManagerSidebar } from './PropertyManagerSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Building2 } from 'lucide-react';

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
        <SidebarInset className="flex-1 flex flex-col">
          {/* Mobile header with menu trigger */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">RentMate</span>
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
