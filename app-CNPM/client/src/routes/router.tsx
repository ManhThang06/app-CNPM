import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { ROLES } from "../constants/role";

import AuthLayout from "../layouts/Auth/AuthLayout";
import MainLayout from "../layouts/Main/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

import DashboardPage from "../pages/common/storekeeperManager/DashBoardPage";
import ProfilePage from "../pages/common/ProfilePage";

import TakeRequestPage from "../pages/pharmacist/TakeRequestPage";
import ReturnMedicinePage from "../pages/pharmacist/ReturnRequestPage";
import RequestHistoryPage from "../pages/pharmacist/RequestHistoryPage";
import MedicinePage from "../pages/common/requesterManager/MedicinePage";

import InventoryPage from "../pages/common/storekeeperManager/InventoryPage";
import StockHistoryPage from "../pages/common/storekeeperManager/StockHistoryPage";
import WarehouseMapPage from "../pages/common/storekeeperManager/WarehouseMapPage";

import AuditPage from "../pages/warehouse-manager/AuditPage";
import CreateAuditSessionPage from "../pages/warehouse-manager/CreateAuditSessionPage";

import ExportPage from "../pages/storekeeper/ExportPage";
import ImportPage from "../pages/storekeeper/ImportPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Auth layout */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.STOREKEEPER, ROLES.MANAGER]}
              />
            }
          >
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
            <Route path={ROUTES.INVENTORY_MAP} element={<WarehouseMapPage />} />
            <Route path={ROUTES.STOCK_HISTORY} element={<StockHistoryPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={[ROLES.REQUESTER, ROLES.MANAGER]} />
            }
          >
            <Route path={ROUTES.MEDICINE} element={<MedicinePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.REQUESTER]} />}>
            <Route
              path={ROUTES.MEDICINE_REQUEST}
              element={<RequestHistoryPage />}
            />
            <Route
              path={ROUTES.MEDICINE_REQUEST_CREATE}
              element={<TakeRequestPage />}
            />
            <Route path={ROUTES.RETURN_MEDICINE} element={<ReturnMedicinePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.MANAGER]} />}>
            <Route path={ROUTES.AUDIT} element={<AuditPage />} />
            <Route
              path={ROUTES.AUDIT_CREATE}
              element={<CreateAuditSessionPage />}
            />
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={[ROLES.STOREKEEPER]} />}
          >
            <Route path={ROUTES.STOCK_EXPORT} element={<ExportPage />} />
            <Route path={ROUTES.STOCK_IMPORT} element={<ImportPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
