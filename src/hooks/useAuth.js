import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { ROLES } from "../constants/roles";

export const useAuth = () => {
  const { user, loading, error } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
    isSales: user?.role === ROLES.SALES,
    logout: () => dispatch(logout()),
  };
};
