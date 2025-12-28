import { useAuth } from '@/contexts/AuthContext';
import LandlordDashboardHome from './landlord/LandlordDashboardHome';
import TenantDashboardHome from './tenant/TenantDashboardHome';
import PropertyManagerDashboardHome from './property-manager/PropertyManagerDashboardHome';

export default function DashboardHome() {
  const { user } = useAuth();

  if (user?.role === 'LANDLORD') {
    return <LandlordDashboardHome />;
  }

  if (user?.role === 'PROPERTY_MANAGER') {
    return <PropertyManagerDashboardHome />;
  }

  return <TenantDashboardHome />;
}
