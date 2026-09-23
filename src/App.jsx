import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./store";
import { getMe } from "./store/slices/authSlice";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersPage from "./pages/admin/UsersPage";
import SalesReportPage from "./pages/admin/SalesReportPage";
import QuotationsPage from "./pages/quotations/QuotationsPage";
import NewQuotationPage from "./pages/quotations/NewQuotationPage";
import QuotationDetailPage from "./pages/quotations/QuotationDetailPage";
import LeadsPage from "./pages/crm/LeadsPage";
import LeadDetailPage from "./pages/crm/LeadDetailPage";
import CustomersPage from "./pages/crm/CustomersPage";
import CustomerDetailPage from "./pages/crm/CustomerDetailPage";
import EnquiriesPage from "./pages/crm/EnquiriesPage";
import EnquiryDetailPage from "./pages/crm/EnquiryDetailPage";
import CataloguePage from "./pages/catalogue/CataloguePage";
import PublicQuotationPage from "./pages/public/PublicQuotationPage";
import EngagementsPage from "./pages/iso/EngagementsPage";
import EngagementDetailPage from "./pages/iso/EngagementDetailPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import { ROLES } from "./constants/roles";

const ADMIN_ONLY = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const PrivateRoute = ({ children, roles }) => {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <div style={styles.loading}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
};

function AppRoutes() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { initialized } = useSelector((s) => s.auth);

  // The customer acceptance link is public and token-authenticated - it must
  // render immediately, without waiting on (or requiring) any staff login
  // state, and regardless of whether the visitor has a stale/foreign
  // accessToken sitting in localStorage from a different session.
  const isPublicRoute = location.pathname.startsWith("/quotation/accept/");

  useEffect(() => {
    if (isPublicRoute) return;
    const token = localStorage.getItem("accessToken");
    if (token) {
      dispatch(getMe());
    } else {
      dispatch({ type: "auth/getMe/rejected" });
    }
  }, [dispatch, isPublicRoute]);

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/quotation/accept/:token" element={<PublicQuotationPage />} />
      </Routes>
    );
  }

  if (!initialized) {
    return <div style={styles.loading}>Loading…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />

      {/* CRM */}
      <Route path="/crm/leads" element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
      <Route path="/crm/leads/:id" element={<PrivateRoute><LeadDetailPage /></PrivateRoute>} />
      <Route path="/crm/customers" element={<PrivateRoute><CustomersPage /></PrivateRoute>} />
      <Route path="/crm/customers/:id" element={<PrivateRoute><CustomerDetailPage /></PrivateRoute>} />
      <Route path="/crm/enquiries" element={<PrivateRoute><EnquiriesPage /></PrivateRoute>} />
      <Route path="/crm/enquiries/:id" element={<PrivateRoute><EnquiryDetailPage /></PrivateRoute>} />

      {/* Service Catalogue - readable by all roles, mutation-gated on the backend */}
      <Route path="/admin/catalogue" element={<PrivateRoute><CataloguePage /></PrivateRoute>} />

      {/* ISO Compliance + Audit Management */}
      <Route path="/iso-engagements" element={<PrivateRoute><EngagementsPage /></PrivateRoute>} />
      <Route path="/iso-engagements/:id" element={<PrivateRoute><EngagementDetailPage /></PrivateRoute>} />

      {/* Quotations */}
      <Route path="/quotations" element={<PrivateRoute><QuotationsPage /></PrivateRoute>} />
      <Route path="/quotations/new" element={<PrivateRoute><NewQuotationPage /></PrivateRoute>} />
      <Route path="/quotations/:id/edit" element={<PrivateRoute><NewQuotationPage /></PrivateRoute>} />
      <Route path="/quotations/:id" element={<PrivateRoute><QuotationDetailPage /></PrivateRoute>} />

      {/* Admin only */}
      <Route path="/admin/users" element={<PrivateRoute roles={ADMIN_ONLY}><UsersPage /></PrivateRoute>} />
      <Route path="/admin/sales-report" element={<PrivateRoute roles={ADMIN_ONLY}><SalesReportPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute roles={ADMIN_ONLY}><SettingsPage /></PrivateRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

const styles = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#1F3C88", fontSize: 16 }
};

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </Provider>
  );
}