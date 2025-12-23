import { useAuth } from '@/contexts/AuthContext';
import LandlordMessages from './landlord/LandlordMessages';
import TenantMessages from './TenantMessages';

export default function Messages() {
  const { user } = useAuth();

  if (user?.role === 'landlord') {
    return <LandlordMessages />;
  }

  return <TenantMessages />;
}
