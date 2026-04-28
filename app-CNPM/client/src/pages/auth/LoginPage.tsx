import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { login as loginApi, register as registerApi } from "../../api/authApi";
import { loginSuccess } from "../../features/auth/authSlice";
import { Icon } from "../../components/UI";
import { usePreferences } from "../../app/preferences";

type AuthSide = "login" | "register";

type LoginPageProps = {
  initialSide?: AuthSide;
};

export default function LoginPage({ initialSide = "login" }: LoginPageProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = usePreferences();

  const [isRegisterSide, setIsRegisterSide] = useState(initialSide === "register");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const clearLoginError = () => setLoginError("");
  const clearRegisterError = () => setRegisterError("");

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setLoginError(t("auth.requiredUsername"));
      return;
    }
    if (!trimmedPassword) {
      setLoginError(t("auth.requiredPassword"));
      return;
    }

    try {
      setLoginLoading(true);
      const res = await loginApi({
        username: trimmedUsername,
        password: trimmedPassword,
      });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      dispatch(loginSuccess({ user, token }));

      navigate(user.role === "REQUESTER" ? "/medicine" : "/dashboard");
    } catch (err) {
      console.log(err);
      setLoginError(t("auth.invalidLogin"));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = registerPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      setRegisterError(t("auth.requiredRegister"));
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setRegisterError(t("auth.passwordMismatch"));
      return;
    }

    try {
      setRegisterLoading(true);
      await registerApi({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
      });

      setUsername(trimmedEmail.split("@")[0]);
      setPassword("");
      setName("");
      setEmail("");
      setRegisterPassword("");
      setConfirmPassword("");
      setIsRegisterSide(false);
      setLoginError(t("auth.registerSuccess"));
    } catch (err: unknown) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        setRegisterError(err.response?.data?.message || t("auth.registerFailed"));
        return;
      }
      setRegisterError(t("auth.unknownError"));
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="auth-flip-wrapper animate-fade-in">
      <div className="auth-card-switch">
        <input
          id="auth-mode-toggle"
          type="checkbox"
          className="auth-flip-toggle"
          checked={isRegisterSide}
          onChange={(e) => {
            setIsRegisterSide(e.target.checked);
            setLoginError("");
            setRegisterError("");
          }}
        />
        <label
          className="auth-mode-switch"
          htmlFor="auth-mode-toggle"
          aria-label={`${t("auth.login")} / ${t("auth.register")}`}
        >
          <span
            className="auth-card-side"
            data-login={t("auth.login")}
            data-register={t("auth.register")}
          />
          <span className="auth-slider" />
        </label>

        <div className="auth-flip-card-inner">
          <section className="auth-flip-card-face auth-flip-card-front" aria-hidden={isRegisterSide}>
            <div className="auth-flip-title">{t("auth.login")}</div>
            <form
              className="auth-flip-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <input
                id="login-username"
                className="auth-flip-input"
                name="username"
                placeholder={t("auth.username")}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearLoginError();
                }}
                autoComplete="username"
              />
              <input
                id="login-password"
                className="auth-flip-input"
                name="password"
                placeholder={t("auth.password")}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearLoginError();
                }}
                autoComplete="current-password"
              />

              {loginError && (
                <div className="auth-flip-message">
                  <Icon name={loginError === t("auth.registerSuccess") ? "check_circle" : "error"} size={15} />
                  {loginError}
                </div>
              )}

              <Link className="auth-flip-link" to="/forgot-password">
                {t("auth.forgotPassword")}
              </Link>

              <button
                id="login-submit"
                className="auth-flip-btn"
                type="submit"
                disabled={loginLoading}
              >
                {loginLoading ? t("auth.loginLoading") : t("auth.loginSubmit")}
              </button>
            </form>
          </section>

          <section className="auth-flip-card-face auth-flip-card-back" aria-hidden={!isRegisterSide}>
            <div className="auth-flip-title">{t("auth.register")}</div>
            <form
              className="auth-flip-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
              }}
            >
              <input
                id="register-name"
                className="auth-flip-input"
                placeholder={t("auth.fullName")}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearRegisterError();
                }}
                autoComplete="name"
              />
              <input
                id="register-email"
                className="auth-flip-input"
                name="email"
                placeholder={t("auth.email")}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearRegisterError();
                }}
                autoComplete="email"
              />
              <input
                id="register-password"
                className="auth-flip-input"
                name="password"
                placeholder={t("auth.password")}
                type="password"
                value={registerPassword}
                onChange={(e) => {
                  setRegisterPassword(e.target.value);
                  clearRegisterError();
                }}
                autoComplete="new-password"
              />
              <input
                id="register-confirm"
                className="auth-flip-input"
                placeholder={t("auth.confirmPassword")}
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearRegisterError();
                }}
                autoComplete="new-password"
              />

              {registerError && (
                <div className="auth-flip-message">
                  <Icon name="error" size={15} />
                  {registerError}
                </div>
              )}

              <button
                id="register-submit"
                className="auth-flip-btn"
                type="submit"
                disabled={registerLoading}
              >
                {registerLoading ? t("auth.registerLoading") : t("auth.registerSubmit")}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
