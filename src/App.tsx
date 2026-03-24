import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import ChangePassword from "./pages/auth/ChangePassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ItemSearch from "./pages/inventory/ItemSearch";
import AddGoods from "./pages/inventory/AddGoods";
import RemoveGoods from "./pages/inventory/RemoveGoods";
import UpdatePrice from "./pages/inventory/UpdatePrice";
import ReplaceItem from "./pages/inventory/ReplaceItem";
import ExpiredGoods from "./pages/inventory/ExpiredGoods";
import PlaceOrder from "./pages/supplier/PlaceOrder";
import GenerateInvoice from "./pages/supplier/GenerateInvoice";
import GenerateReceipt from "./pages/sales/GenerateReceipt";
import CancelReceipt from "./pages/sales/CancelReceipt";
import CustomerRequest from "./pages/sales/CustomerRequest";
import SummaryReport from "./pages/report/SummaryReport";
import UserManagement from "./pages/admin/UserManagement";
import SystemLogs from "./pages/admin/SystemLogs";
import NavBar from "./components/NavBar";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <NavBar />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="inventory/search" element={<ItemSearch />} />
          <Route
            path="inventory/add"
            element={
              <PrivateRoute roles={["manager"]}>
                <AddGoods />
              </PrivateRoute>
            }
          />
          <Route
            path="inventory/remove"
            element={
              <PrivateRoute roles={["manager"]}>
                <RemoveGoods />
              </PrivateRoute>
            }
          />
          <Route
            path="inventory/update-price"
            element={
              <PrivateRoute roles={["manager"]}>
                <UpdatePrice />
              </PrivateRoute>
            }
          />
          <Route path="inventory/replace" element={<ReplaceItem />} />
          <Route
            path="inventory/expired"
            element={
              <PrivateRoute roles={["manager"]}>
                <ExpiredGoods />
              </PrivateRoute>
            }
          />
          <Route
            path="supplier/place-order"
            element={
              <PrivateRoute roles={["manager"]}>
                <PlaceOrder />
              </PrivateRoute>
            }
          />
          <Route
            path="supplier/invoice"
            element={
              <PrivateRoute roles={["manager"]}>
                <GenerateInvoice />
              </PrivateRoute>
            }
          />
          <Route
            path="sales/receipt"
            element={
              <PrivateRoute roles={["salesperson", "manager"]}>
                <GenerateReceipt />
              </PrivateRoute>
            }
          />
          <Route
            path="sales/cancel-receipt"
            element={
              <PrivateRoute roles={["salesperson", "manager"]}>
                <CancelReceipt />
              </PrivateRoute>
            }
          />
          <Route
            path="sales/customer-request"
            element={
              <PrivateRoute roles={["salesperson", "manager"]}>
                <CustomerRequest />
              </PrivateRoute>
            }
          />
          <Route
            path="report"
            element={
              <PrivateRoute roles={["manager", "admin"]}>
                <SummaryReport />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <PrivateRoute roles={["admin"]}>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/logs"
            element={
              <PrivateRoute roles={["admin"]}>
                <SystemLogs />
              </PrivateRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
