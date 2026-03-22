import { Navigate, Outlet } from "react-router-dom";
import React from "react";
import { getUser, hasRole } from "../utils/auth";

const PrivateRoute = ({
  children,
  roles,
}: {
  children?: React.ReactNode;
  roles?: string[];
}) => {
  const user = getUser();
  if (!user) return <Navigate to="/login" />;
  // admin bypasses all role restrictions
  if (roles && user.role !== "admin" && !hasRole(roles))
    return <Navigate to="/" />;
  return children ? children : <Outlet />;
};

export default PrivateRoute;
