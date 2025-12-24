import { useAuth } from '@/contexts/AuthContext';
import LandlordDashboardHome from './landlord/LandlordDashboardHome';
import TenantDashboardHome from './tenant/TenantDashboardHome';
import PropertyManagerDashboardHome from './property-manager/PropertyManagerDashboardHome';

export default function DashboardHome() {
  const { user } = useAuth();

  if (user?.role === 'landlord') {
    return <LandlordDashboardHome />;
  }

  if (user?.role === 'property_manager') {
    return <PropertyManagerDashboardHome />;
  }

  return <TenantDashboardHome />;
}
