import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../../../app/store";
import { getDashboardSummary } from "../../../api/medicineRequestApi";
import { MetricCard, Icon, PageHeader } from "../../../components/UI";
import { ROLES } from "../../../constants/role";
import { ROUTES } from "../../../constants/routes";
import { usePreferences } from "../../../app/preferences";

type Summary = {
  totalSkus: number;
  totalBatches: number;
  nearExpiryCount: number;
  expiredCount: number;
  totalStock: number;
};

type QuickAction = {
  labelKey:
    | "quick.warehouseMap"
    | "quick.handleExport"
    | "quick.handleImport"
    | "quick.createImportNotice"
    | "quick.addMedicine"
    | "quick.createAudit"
    | "quick.createRequest";
  icon: string;
  color: string;
  path: string;
  roles: string[];
};

const quickActions: QuickAction[] = [
  {
    labelKey: "quick.warehouseMap",
    icon: "map",
    color: "var(--primary)",
    path: ROUTES.INVENTORY_MAP,
    roles: [ROLES.STOREKEEPER, ROLES.MANAGER],
  },
  {
    labelKey: "quick.handleExport",
    icon: "output",
    color: "#059669",
    path: ROUTES.STOCK_EXPORT,
    roles: [ROLES.STOREKEEPER],
  },
  {
    labelKey: "quick.handleImport",
    icon: "input",
    color: "#2563EB",
    path: ROUTES.STOCK_IMPORT,
    roles: [ROLES.STOREKEEPER],
  },
  {
    labelKey: "quick.createImportNotice",
    icon: "notification_add",
    color: "#2563EB",
    path: `${ROUTES.INVENTORY}?action=import-request`,
    roles: [ROLES.MANAGER],
  },
  {
    labelKey: "quick.addMedicine",
    icon: "medication",
    color: "var(--primary)",
    path: `${ROUTES.MEDICINE}?action=add`,
    roles: [ROLES.MANAGER],
  },
  {
    labelKey: "quick.createAudit",
    icon: "fact_check",
    color: "#F59E0B",
    path: ROUTES.AUDIT_CREATE,
    roles: [ROLES.MANAGER],
  },
  {
    labelKey: "quick.createRequest",
    icon: "add",
    color: "var(--secondary)",
    path: ROUTES.MEDICINE_REQUEST_CREATE,
    roles: [ROLES.REQUESTER],
  },
];

function SkeletonCard() {
  return (
    <div
      className="metric-card"
      style={{ minHeight: 100, animation: "pulse 1.5s ease-in-out infinite" }}
    >
      <div style={{ width: "60%", height: 12, background: "var(--outline-variant)", borderRadius: 6, marginBottom: 12 }} />
      <div style={{ width: "40%", height: 28, background: "var(--outline-variant)", borderRadius: 6 }} />
    </div>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const { t } = usePreferences();

  return (
    <Link to={action.path} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--surface-container-low)",
          borderRadius: 10,
          padding: "16px 14px",
          textAlign: "center",
          transition: "all 0.15s",
          cursor: "pointer",
          border: "1px solid var(--outline-variant)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--surface-container)";
          e.currentTarget.style.borderColor = action.color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--surface-container-low)";
          e.currentTarget.style.borderColor = "var(--outline-variant)";
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${action.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <Icon name={action.icon} size={22} style={{ color: action.color }} />
        </div>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--on-surface)" }}>
          {t(action.labelKey)}
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { language, t } = usePreferences();
  const isRequestor = user?.role === ROLES.REQUESTER;
  const visibleQuickActions = quickActions.filter((action) =>
    action.roles.includes(user?.role ?? ""),
  );

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then((res) => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);



  return (
    <div className="page animate-fade-in">
      <PageHeader
        title={t("dashboard.title")}
        subtitle={new Date().toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
          <MetricCard
            label={t("dashboard.totalSkus")}
            value={summary?.totalSkus ?? 0}
            icon="inventory_2"
            color="var(--primary)"
            trend={{ up: true, label: t("dashboard.skuManaged") }}
          />
          <MetricCard
            label={t("dashboard.totalBatches")}
            value={summary?.totalBatches ?? 0}
            icon="layers"
            color="var(--secondary)"
            trend={{ up: true, label: t("dashboard.batchInStock") }}
          />
          <MetricCard
            label={t("dashboard.nearExpiry")}
            value={summary?.nearExpiryCount ?? 0}
            icon="schedule"
            color="#F59E0B"
            borderColor="#F59E0B"
            trend={{ up: false, label: t("dashboard.needsAttention") }}
          />
        </div>
      )}

      {!isRequestor && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div className="metric-card" style={{ borderBottom: "4px solid var(--error)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>
                  {t("dashboard.expired")}
                </div>
                <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--error)", lineHeight: 1 }}>
                  {loading ? "-" : (summary?.expiredCount ?? 0)}
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--error-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="dangerous" size={22} style={{ color: "var(--error)" }} />
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6, background: "var(--error-container)", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--error)", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--on-error-container)" }}>
                {t("dashboard.handleNow")}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>
                  {t("dashboard.totalStock")}
                </div>
                <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800, color: "#059669", lineHeight: 1 }}>
                  {loading ? "-" : (summary?.totalStock ?? 0).toLocaleString("vi-VN")}
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(5,150,105,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="warehouse" size={22} style={{ color: "#059669" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {visibleQuickActions.length > 0 && (
        <div className="metric-card">
          <h3 className="font-headline" style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 16 }}>
            {t("dashboard.quickActions")}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {visibleQuickActions.map((action) => (
              <QuickActionCard key={action.path} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
