import { useState } from "react";
import { PageHeader, Icon } from "../../components/UI";

/* ─── Giữ nguyên types & mock data ─── */
type UserProfile = {
  name: string;
  email: string;
  role: "requestor" | "storekeeper" | "warehouse_manager";
  phone: string;
  address: string;
};

const fakeUser: UserProfile = {
  name: "Nguyễn Văn A",
  email: "a@example.com",
  role: "storekeeper",
  phone: "0901234567",
  address: "Phường X, Quận Y",
};

const ROLE_LABEL: Record<string, string> = {
  requestor: "Trình dược viên",
  storekeeper: "Thủ kho",
  warehouse_manager: "Quản lý kho",
};

export default function ProfilePage() {
  /* ─── Giữ nguyên state & handlers ─── */
  const [user, setUser] = useState<UserProfile>(fakeUser);
  const [form, setForm] = useState<UserProfile>(user);

  const handleSave = () => {
    setUser(form);
    alert("Cập nhật thành công!");
  };

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.newPassword) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      alert("Mật khẩu xác nhận không khớp");
      return;
    }
    alert("Đổi mật khẩu thành công!");
    setPasswordForm({ current: "", newPassword: "", confirm: "" });
  };

  const initials = form.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="page animate-fade-in">
      <PageHeader title="Thông tin cá nhân" subtitle="Xem và cập nhật thông tin tài khoản" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {/* ─── Profile card ─── */}
        <div className="metric-card">
          {/* Avatar section */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--outline-variant)" }}>
            <div
              className="sig-gradient"
              style={{ width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <span className="font-headline" style={{ color: "#fff", fontWeight: 800, fontSize: "1.4rem" }}>
                {initials}
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--on-surface)" }}>{form.name}</div>
              <span className={`role-badge role-${form.role}`}>{ROLE_LABEL[form.role] ?? form.role}</span>
            </div>
          </div>

          <div className="wms-form" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Họ tên</label>
              <input
                id="profile-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Họ và tên"
              />
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Email</label>
              <input
                id="profile-email"
                disabled
                value={form.email}
                style={{ opacity: 0.6 }}
              />
            </div>

            {/* Phone */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Số điện thoại</label>
              <input
                id="profile-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0900000000"
              />
            </div>

            {/* Role */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Vai trò</label>
              <input
                id="profile-role"
                disabled
                value={ROLE_LABEL[form.role] ?? form.role}
                style={{ opacity: 0.6 }}
              />
            </div>

            {/* Address */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Địa chỉ</label>
              <input
                id="profile-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Địa chỉ"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button id="btn-save-profile" className="btn btn-primary" onClick={handleSave}>
                <Icon name="save" size={16} /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>

        {/* ─── Change password card ─── */}
        <div className="metric-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--outline-variant)" }}>
            <div
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(186,26,26,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="lock" size={20} style={{ color: "var(--error)" }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--on-surface)" }}>Đổi mật khẩu</h2>
              <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)" }}>Cập nhật mật khẩu bảo mật tài khoản</p>
            </div>
          </div>

          <div className="wms-form" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Mật khẩu hiện tại</label>
              <input
                id="password-current"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Mật khẩu mới</label>
              <input
                id="password-new"
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Xác nhận mật khẩu mới</label>
              <input
                id="password-confirm"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button id="btn-change-password" className="btn btn-danger" onClick={handleChangePassword}>
                <Icon name="lock_reset" size={16} /> Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
