import { useAuth } from '@/contexts/AuthContext';
import LandlordApplications from './landlord/LandlordApplications';
import TenantApplications from './TenantApplications';

export default function Applications() {
  const { user } = useAuth();

  if (user?.role === 'landlord') {
    return <LandlordApplications />;
  }

  return <TenantApplications />;
}
