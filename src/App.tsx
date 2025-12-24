import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

// Shared Dashboard imports
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Applications from "./pages/dashboard/Applications";
import Messages from "./pages/dashboard/Messages";
import Profile from "./pages/dashboard/Profile";
import Notifications from "./pages/dashboard/Notifications";

// Tenant Dashboard imports
import TenantRentals from "./pages/dashboard/tenant/TenantRentals";
import TenantSavedProperties from "./pages/dashboard/tenant/TenantSavedProperties";
import TenantPayments from "./pages/dashboard/tenant/TenantPayments";
import TenantMaintenance from "./pages/dashboard/tenant/TenantMaintenance";
import TenantDocuments from "./pages/dashboard/tenant/TenantDocuments";
import TenantLeases from "./pages/dashboard/tenant/TenantLeases";

// Landlord Dashboard imports
import LandlordProperties from "./pages/dashboard/landlord/LandlordProperties";
import LeaseAgreements from "./pages/dashboard/landlord/LeaseAgreements";
import LandlordMaintenance from "./pages/dashboard/landlord/LandlordMaintenance";

// Property Manager Dashboard imports
import PropertyManagerProperties from "./pages/dashboard/property-manager/PropertyManagerProperties";
import PropertyManagerApplications from "./pages/dashboard/property-manager/PropertyManagerApplications";
import PropertyManagerLeases from "./pages/dashboard/property-manager/PropertyManagerLeases";
import PropertyManagerMaintenance from "./pages/dashboard/property-manager/PropertyManagerMaintenance";
import PropertyManagerMessages from "./pages/dashboard/property-manager/PropertyManagerMessages";

const queryClient = new QueryClient();

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              {/* Common routes - role-aware home */}
              <Route index element={<DashboardHome />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              
              {/* Tenant-specific routes */}
              <Route path="rentals" element={<TenantRentals />} />
              <Route path="saved" element={<TenantSavedProperties />} />
              <Route path="applications" element={<Applications />} />
              <Route path="payments" element={<TenantPayments />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:id" element={<Messages />} />
              <Route path="maintenance" element={<TenantMaintenance />} />
              <Route path="documents" element={<TenantDocuments />} />
              <Route path="leases" element={<TenantLeases />} />
              
              {/* Landlord-specific routes */}
              <Route path="properties" element={<LandlordProperties />} />
              <Route path="landlord-leases" element={<LeaseAgreements />} />
              <Route path="landlord-maintenance" element={<LandlordMaintenance />} />
              
              {/* Property Manager routes */}
              <Route path="pm-properties" element={<PropertyManagerProperties />} />
              <Route path="pm-applications" element={<PropertyManagerApplications />} />
              <Route path="pm-leases" element={<PropertyManagerLeases />} />
              <Route path="pm-maintenance" element={<PropertyManagerMaintenance />} />
              <Route path="pm-messages" element={<PropertyManagerMessages />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
