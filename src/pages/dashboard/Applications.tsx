import { useAuth } from '@/contexts/AuthContext';
import LandlordApplications from './landlord/LandlordApplications';
import TenantApplications from './tenant/TenantApplications';

export default function Applications() {
  const { user } = useAuth();

  if (user?.role === 'LANDLORD') {
    return <LandlordApplications />;
  }

  return <TenantApplications />;
}
