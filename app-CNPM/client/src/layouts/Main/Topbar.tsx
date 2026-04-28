import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { RootState } from "../../app/store";
import { logout } from "../../features/auth/authSlice";
import { ROUTES } from "../../constants/routes";
import { Icon } from "../../components/UI";
import { LANGUAGE_FLAG_IMAGES, usePreferences } from "../../app/preferences";

export default function Topbar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, theme, toggleLanguage, toggleTheme, t } = usePreferences();

  const pageTitles: Record<string, string> = {
    [ROUTES.DASHBOARD]: t("nav.dashboard"),
    [ROUTES.INVENTORY]: t("nav.inventory"),
    [ROUTES.INVENTORY_MAP]: t("quick.warehouseMap"),
    [ROUTES.STOCK_HISTORY]: t("nav.stockHistory"),
    [ROUTES.STOCK_EXPORT]: t("nav.stockExport"),
    [ROUTES.STOCK_IMPORT]: t("nav.stockImport"),
    [ROUTES.MEDICINE]: t("nav.medicine"),
    [ROUTES.MEDICINE_REQUEST]: t("nav.medicineRequest"),
    [ROUTES.MEDICINE_REQUEST_CREATE]: t("nav.medicineRequestCreate"),
    [ROUTES.AUDIT]: t("nav.audit"),
    [ROUTES.AUDIT_CREATE]: t("nav.auditCreate"),
    [ROUTES.PROFILE]: t("nav.profile"),
  };

  const roleLabel: Record<string, string> = {
    REQUESTER: t("role.requester"),
    STOREKEEPER: t("role.storekeeper"),
    MANAGER: t("role.manager"),
    requestor: t("role.requester"),
  };

  const title = pageTitles[location.pathname] ?? t("app.name");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header className="wms-topbar">
      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          className="font-headline"
          style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--on-surface)" }}
        >
          {title}
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          className="btn btn-secondary app-control-btn"
          onClick={toggleLanguage}
          title={t("common.language")}
        >
          <img
            className="language-flag"
            src={LANGUAGE_FLAG_IMAGES[language]}
            alt={language === "vi" ? "Vietnamese" : "English"}
          />
        </button>

        <button
          className="btn btn-secondary app-control-btn"
          onClick={toggleTheme}
          title={t("common.theme")}
        >
          <Icon name={theme === "dark" ? "dark_mode" : "light_mode"} size={18} />
          {theme === "dark" ? t("common.dark") : t("common.light")}
        </button>

        {/* Notifications stub */}
        <button
          className="btn btn-ghost"
          style={{ padding: 8, borderRadius: 8, position: "relative" }}
          title={t("common.notifications")}
        >
          <Icon name="notifications" size={22} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: "var(--error)",
              borderRadius: "50%",
            }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: "var(--outline-variant)" }} />

        {/* User info */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => navigate(ROUTES.PROFILE)}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--on-surface)" }}>
              {user?.name ?? "—"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--outline)" }}>
              {roleLabel[user?.role ?? ""] ?? user?.role}
            </div>
          </div>
          <div className="avatar">{initials}</div>
        </div>

        {/* Logout */}
        <button
          className="btn btn-ghost"
          style={{ padding: 8, borderRadius: 8, color: "var(--error)" }}
          onClick={handleLogout}
          title={t("common.logout")}
        >
          <Icon name="logout" size={20} />
        </button>
      </div>
    </header>
  );
}
