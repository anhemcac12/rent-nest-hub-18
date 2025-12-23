import { useAuth } from '@/contexts/AuthContext';
import LandlordDashboardHome from './landlord/LandlordDashboardHome';
import TenantDashboardHome from './TenantDashboardHome';

export default function DashboardHome() {
  const { user } = useAuth();

  if (user?.role === 'landlord') {
    return <LandlordDashboardHome />;
  }

  return <TenantDashboardHome />;
}
