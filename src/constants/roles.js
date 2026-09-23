// Must stay in sync with backend/src/config/roles.js. Frontend role checks
// are for UI/navigation convenience only - the backend is the real
// authorization boundary (see middleware/auth.js `authorize`).
export const ROLES = Object.freeze({
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  SALES: "sales",
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));
