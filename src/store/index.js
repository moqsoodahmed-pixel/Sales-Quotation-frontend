import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import quotationReducer from "./slices/quotationSlice";
import userReducer from "./slices/userSlice";
import leadReducer from "./slices/leadSlice";
import customerReducer from "./slices/customerSlice";
import enquiryReducer from "./slices/enquirySlice";
import catalogueReducer from "./slices/catalogueSlice";
import documentReducer from "./slices/documentSlice";
import isoEngagementReducer from "./slices/isoEngagementSlice";
import isoClauseReducer from "./slices/isoClauseSlice";
import assessmentReducer from "./slices/complianceAssessmentSlice";
import auditReducer from "./slices/auditSlice";
import findingReducer from "./slices/auditFindingSlice";
import correctiveActionReducer from "./slices/correctiveActionSlice";
import dashboardReducer from "./slices/dashboardSlice";
import notificationReducer from "./slices/notificationSlice";
import settingsReducer from "./slices/settingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quotations: quotationReducer,
    users: userReducer,
    leads: leadReducer,
    customers: customerReducer,
    enquiries: enquiryReducer,
    catalogue: catalogueReducer,
    documents: documentReducer,
    isoEngagements: isoEngagementReducer,
    isoClauses: isoClauseReducer,
    assessments: assessmentReducer,
    audits: auditReducer,
    findings: findingReducer,
    correctiveActions: correctiveActionReducer,
    dashboard: dashboardReducer,
    notifications: notificationReducer,
    settings: settingsReducer,
  },
});

export default store;
