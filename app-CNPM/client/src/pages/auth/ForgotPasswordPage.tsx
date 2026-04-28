import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/UI";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  return (
    <div className="auth-card animate-fade-in">
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div
          className="sig-gradient"
          style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="medical_services" size={22} fill style={{ color: "#fff" }} />
        </div>
        <span
          className="font-headline"
          style={{ fontWeight: 800, fontSize: "1rem", background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          Pharma WMS
        </span>
      </div>

      <Link
        to="/login"
        style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--on-surface-variant)", fontSize: "0.8rem", textDecoration: "none", marginBottom: 20 }}
      >
        <Icon name="arrow_back" size={16} /> Quay lại đăng nhập
      </Link>

      {!sent ? (
        <>
          <h1 className="font-headline" style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Quên mật khẩu
          </h1>
          <p style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem", marginBottom: 24 }}>
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
          </p>

          <form
            className="wms-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              id="forgot-submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px 18px", borderRadius: 10 }}
            >
              <Icon name="send" size={18} /> Gửi liên kết đặt lại
            </button>
          </form>
        </>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "rgba(111,251,190,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon name="mark_email_read" size={32} style={{ color: "#005236" }} />
          </div>
          <h2 className="font-headline" style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 8 }}>
            Đã gửi email!
          </h2>
          <p style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem" }}>
            Kiểm tra hộp thư <strong>{email}</strong> để đặt lại mật khẩu.
          </p>
        </div>
      )}
    </div>
  );
}
