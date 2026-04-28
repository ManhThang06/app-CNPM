import { LANGUAGE_FLAG_IMAGES, usePreferences } from "../app/preferences";
import { Icon } from "./UI";

export default function PreferenceControls() {
  const { language, theme, toggleLanguage, toggleTheme, t } = usePreferences();

  return (
    <div className="preference-controls">
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
    </div>
  );
}
