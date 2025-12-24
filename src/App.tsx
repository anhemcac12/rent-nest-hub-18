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

// Dashboard imports
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Rentals from "./pages/dashboard/Rentals";
import SavedProperties from "./pages/dashboard/SavedProperties";
import Applications from "./pages/dashboard/Applications";
import Payments from "./pages/dashboard/Payments";
import Messages from "./pages/dashboard/Messages";
import Maintenance from "./pages/dashboard/Maintenance";
import Documents from "./pages/dashboard/Documents";
import Profile from "./pages/dashboard/Profile";
import Notifications from "./pages/dashboard/Notifications";
import TenantLeases from "./pages/dashboard/TenantLeases";

// Landlord Dashboard imports
import LandlordDashboardHome from "./pages/dashboard/landlord/LandlordDashboardHome";
import LandlordProperties from "./pages/dashboard/landlord/LandlordProperties";
import LandlordApplications from "./pages/dashboard/landlord/LandlordApplications";
import LeaseAgreements from "./pages/dashboard/landlord/LeaseAgreements";
import LandlordMessages from "./pages/dashboard/landlord/LandlordMessages";

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
              <Route path="rentals" element={<Rentals />} />
              <Route path="saved" element={<SavedProperties />} />
              <Route path="applications" element={<Applications />} />
              <Route path="payments" element={<Payments />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:id" element={<Messages />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="documents" element={<Documents />} />
              
              {/* Tenant lease agreements */}
              <Route path="leases" element={<TenantLeases />} />
              
              {/* Landlord-specific routes */}
              <Route path="properties" element={<LandlordProperties />} />
              <Route path="leases" element={<LeaseAgreements />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
