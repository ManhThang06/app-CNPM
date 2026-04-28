import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { usePreferences } from "../../app/preferences";
import PreferenceControls from "../../components/PreferenceControls";
import { ROUTES } from "../../constants/routes";

export default function AuthLayout() {
  const { t } = usePreferences();
  const location = useLocation();
  const canChangePreferences =
    location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER;

  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ─── Video Background ─── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260228_065522_522e2295-ba22-457e-8fdb-fbcd68109c73.mp4"
      />

      {canChangePreferences && <PreferenceControls />}

      {/* ─── Hero Content ─── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 60px",
        gap: 0,
      }}>
        {/* Headline */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "clamp(24px, 4vw, 44px)",
            color: "#fff",
            letterSpacing: "-4px",
            lineHeight: 1.1,
            margin: "0 0 4px 0",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}>
            {t("auth.hero.line1")}
          </p>
          <p style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(52px, 9vw, 84px)",
            color: "#fff",
            lineHeight: 1.05,
            margin: 0,
            textShadow: "0 4px 32px rgba(0,0,0,0.25)",
            letterSpacing: "-1px",
          }}>
            {t("auth.hero.line2")}
          </p>
        </div>

        {/* Subtext */}
        <p style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 500,
          fontSize: 18,
          color: "rgba(255,255,255,0.88)",
          marginBottom: 36,
          maxWidth: 520,
          lineHeight: 1.6,
          textShadow: "0 1px 8px rgba(0,0,0,0.2)",
        }}>
          {t("auth.hero.subtitle")}
        </p>

        {/* CTA Button */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.97)",
            color: "#111",
            border: "none",
            borderRadius: 999,
            padding: "14px 28px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
          }}
        >
          {/* Play icon */}
          <span style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <path d="M1 1L9 6L1 11V1Z" fill="white"/>
            </svg>
          </span>
          {t("auth.hero.cta")}
        </button>

      </div>

      {/* ─── Modal Overlay ─── */}
      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            animation: "auth-modal-in 0.25s ease",
            padding: "24px",
          }}
        >
          {/* Glass card */}
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: 420,
            background: "color-mix(in srgb, var(--surface-container-lowest) 94%, transparent)",
            backdropFilter: "blur(32px)",
            borderRadius: 24,
            boxShadow: "0 24px 80px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.12)",
            padding: "36px 30px 32px",
            border: "1px solid var(--outline-variant)",
            animation: "auth-card-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              aria-label="Đóng"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "rgba(128,128,128,0.15)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--on-surface)",
                fontSize: 18,
                lineHeight: 1,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(128,128,128,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(128,128,128,0.15)")}
            >
              ✕
            </button>

            <Outlet />
          </div>
        </div>
      )}

      {/* ─── Google Fonts ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Instrument+Serif:ital@0;1&display=swap');

        @keyframes auth-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }

        @keyframes auth-modal-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes auth-card-in {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (max-width: 640px) {
          .auth-nav-links {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
