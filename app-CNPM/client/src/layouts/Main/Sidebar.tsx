import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ROUTES } from "../../constants/routes";
import { ROLES } from "../../constants/role";
import type { RootState } from "../../app/store";
import { logout } from "../../features/auth/authSlice";
import { Icon } from "../../components/UI";
import { usePreferences } from "../../app/preferences";

/* ─── Menu config (giữ nguyên roles logic từ bản gốc) ─── */
const menu = [
  {
    name: "Tổng quan",
    path: ROUTES.DASHBOARD,
    icon: "dashboard",
    roles: [ROLES.STOREKEEPER, ROLES.MANAGER],
  },
  {
    name: "Danh sách thuốc",
    path: ROUTES.MEDICINE,
    icon: "medication",
    roles: [ROLES.REQUESTER, ROLES.MANAGER],
  },
  {
    name: "Yêu cầu lấy thuốc",
    path: ROUTES.MEDICINE_REQUEST,
    icon: "history_edu",
    roles: [ROLES.REQUESTER],
  },
  {
    name: "Kho thuốc",
    path: ROUTES.INVENTORY,
    icon: "inventory_2",
    roles: [ROLES.STOREKEEPER, ROLES.MANAGER],
  },
  {
    name: "Lịch sử kho",
    path: ROUTES.STOCK_HISTORY,
    icon: "history",
    roles: [ROLES.STOREKEEPER, ROLES.MANAGER],
  },
  {
    name: "Yêu cầu xuất kho",
    path: ROUTES.STOCK_EXPORT,
    icon: "output",
    roles: [ROLES.STOREKEEPER],
  },
  {
    name: "Thông báo nhập kho",
    path: ROUTES.STOCK_IMPORT,
    icon: "input",
    roles: [ROLES.STOREKEEPER],
  },
  {
    name: "Kiểm kê",
    path: ROUTES.AUDIT,
    icon: "fact_check",
    roles: [ROLES.MANAGER],
  },
];

export default function Sidebar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = usePreferences();

  const menuLabel: Record<string, string> = {
    [ROUTES.DASHBOARD]: t("nav.dashboard"),
    [ROUTES.MEDICINE]: t("nav.medicine"),
    [ROUTES.MEDICINE_REQUEST]: t("nav.medicineRequest"),
    [ROUTES.INVENTORY]: t("nav.inventory"),
    [ROUTES.STOCK_HISTORY]: t("nav.stockHistory"),
    [ROUTES.STOCK_EXPORT]: t("nav.stockExport"),
    [ROUTES.STOCK_IMPORT]: t("nav.stockImport"),
    [ROUTES.AUDIT]: t("nav.audit"),
  };

  const roleLabel: Record<string, string> = {
    REQUESTER: t("role.requester"),
    STOREKEEPER: t("role.storekeeper"),
    MANAGER: t("role.manager"),
    requestor: t("role.requester"),
  };

  /* ─── Giữ nguyên logic logout và role filtering ─── */
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const filteredMenu = menu.filter((item) =>
    item.roles.includes(user?.role || ""),
  );

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <aside className="wms-sidebar">
      {/* ─── Logo ─── */}
      <div style={{ padding: "20px 20px 12px" }}>
        <Link
          to={user?.role === ROLES.REQUESTER ? ROUTES.MEDICINE : ROUTES.DASHBOARD}
          style={{ textDecoration: "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              className="sig-gradient"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="medical_services" size={22} fill style={{ color: "#fff" }} />
            </div>
            <div>
              <div
                className="font-headline"
                style={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1.2,
                }}
              >
                {t("app.name")}
              </div>
              <div className="text-label-sm" style={{ color: "var(--outline)", marginTop: 2 }}>
                {t("app.subtitle")}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ─── Divider ─── */}
      <div style={{ height: 1, background: "var(--outline-variant)", margin: "0 16px 8px" }} />

      {/* ─── Nav ─── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <Icon name={item.icon} size={20} className="nav-icon" />
            <span>{menuLabel[item.path] ?? item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* ─── Bottom: user + logout ─── */}
      <div
        style={{
          borderTop: "1px solid var(--outline-variant)",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Profile link */}
        {user && (
          <NavLink
            to={ROUTES.PROFILE}
            style={{ textDecoration: "none" }}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <div className="avatar" style={{ width: 30, height: 30, fontSize: "0.75rem" }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </div>
              <div
                style={{ fontSize: "0.7rem", color: "var(--outline)", marginTop: 1 }}
              >
                {roleLabel[user.role] ?? user.role}
              </div>
            </div>
          </NavLink>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="nav-item btn-ghost"
          style={{
            border: "none",
            width: "100%",
            color: "var(--error)",
            justifyContent: "flex-start",
          }}
        >
          <Icon name="logout" size={20} className="nav-icon" />
          <span>{t("common.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
