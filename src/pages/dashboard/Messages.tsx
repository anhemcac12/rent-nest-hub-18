import { useAuth } from '@/contexts/AuthContext';
import LandlordMessages from './landlord/LandlordMessages';
import TenantMessages from './tenant/TenantMessages';

export default function Messages() {
  const { user } = useAuth();

  if (user?.role === 'LANDLORD') {
    return <LandlordMessages />;
  }

  return <TenantMessages />;
}
