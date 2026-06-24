import { Button, Select, Tooltip } from "antd";
import {
  SafetyOutlined, GithubOutlined, BulbOutlined, BulbFilled,
  ArrowRightOutlined, DatabaseOutlined, ScanOutlined, RobotOutlined,
  ThunderboltOutlined, CameraOutlined, FileTextOutlined, AuditOutlined,
  GlobalOutlined, WarningOutlined, FileSearchOutlined, LineChartOutlined,
  BankOutlined, ApartmentOutlined, SafetyCertificateOutlined, UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useT } from "../i18n/I18nProvider";
import { useTheme } from "../context/ThemeContext";
import { LANGS, LANG_SHORT, type Lang } from "../i18n/resources";

const GITHUB_URL = "https://github.com/diyorbek20037773/bank_ai_jizzax";

const FEATURES = [
  { icon: <DatabaseOutlined />, key: "f1", color: "#1677FF" },
  { icon: <ScanOutlined />, key: "f2", color: "#13C2C2" },
  { icon: <RobotOutlined />, key: "f3", color: "#722ED1" },
  { icon: <ThunderboltOutlined />, key: "f4", color: "#FA8C16" },
  { icon: <CameraOutlined />, key: "f5", color: "#EB2F96" },
  { icon: <FileTextOutlined />, key: "f6", color: "#52C41A" },
  { icon: <AuditOutlined />, key: "f7", color: "#FF4D4F" },
  { icon: <GlobalOutlined />, key: "f8", color: "#2F54EB" },
];

const TECH = ["React 19", "TypeScript", "FastAPI", "PostgreSQL", "Gemini AI", "Ant Design", "Docker", "Railway"];

const PROBLEMS = [
  { icon: <WarningOutlined />, key: "p1", color: "#FF4D4F" },
  { icon: <FileSearchOutlined />, key: "p2", color: "#FA8C16" },
  { icon: <LineChartOutlined />, key: "p3", color: "#722ED1" },
];

const STEPS = [
  { icon: <DatabaseOutlined />, key: "s1" },
  { icon: <ScanOutlined />, key: "s2" },
  { icon: <UserOutlined />, key: "s3" },
  { icon: <RobotOutlined />, key: "s4" },
];

const AUDIENCE = [
  { icon: <BankOutlined />, key: "a1", color: "#1677FF" },
  { icon: <ApartmentOutlined />, key: "a2", color: "#13C2C2" },
  { icon: <SafetyCertificateOutlined />, key: "a3", color: "#52C41A" },
  { icon: <UserOutlined />, key: "a4", color: "#FA8C16" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useT();
  const { mode, toggle } = useTheme();

  return (
    <div className="landing">
      {/* NAV */}
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="landing-logo"><SafetyOutlined /></div>
          <span>{t("common.appName")}</span>
        </div>
        <div className="landing-nav-actions">
          <Select
            value={lang}
            onChange={(l) => setLang(l as Lang)}
            size="small"
            variant="borderless"
            popupMatchSelectWidth={false}
            options={LANGS.map((l) => ({ value: l, label: LANG_SHORT[l] }))}
          />
          <Tooltip title={t("common.theme")}>
            <Button type="text" shape="circle"
              icon={mode === "dark" ? <BulbFilled style={{ color: "#FAAD14" }} /> : <BulbOutlined />}
              onClick={toggle} />
          </Tooltip>
          <Tooltip title={t("common.sourceCode")}>
            <Button type="text" shape="circle" icon={<GithubOutlined />} href={GITHUB_URL} target="_blank" />
          </Tooltip>
          <Button type="primary" onClick={() => navigate("/login")}>{t("landing.login")}</Button>
        </div>
      </header>

      {/* HERO */}
      <section className="landing-hero">
        <div className="landing-orb landing-orb-a" />
        <div className="landing-orb landing-orb-b" />
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <ThunderboltOutlined /> {t("landing.heroBadge")}
          </div>
          <h1 className="landing-title">{t("landing.heroTitle")}</h1>
          <p className="landing-subtitle">{t("landing.heroSubtitle")}</p>
          <div className="landing-cta">
            <Button type="primary" size="large" onClick={() => navigate("/login")}>
              {t("landing.ctaDemo")} <ArrowRightOutlined />
            </Button>
            <Button size="large" icon={<GithubOutlined />} href={GITHUB_URL} target="_blank">
              {t("landing.ctaGithub")}
            </Button>
          </div>

          <div className="landing-stats">
            <div className="landing-stat"><div className="ls-value">90+</div><div className="ls-label">{t("landing.statAssets")}</div></div>
            <div className="landing-stat"><div className="ls-value">90+</div><div className="ls-label">{t("landing.statEmployees")}</div></div>
            <div className="landing-stat"><div className="ls-value">7</div><div className="ls-label">{t("landing.statAiFunctions")}</div></div>
            <div className="landing-stat"><div className="ls-value">3</div><div className="ls-label">{t("landing.statLanguages")}</div></div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="landing-about">
        <div className="landing-about-inner">
          <h2 className="landing-h2">{t("landing.aboutTitle")}</h2>
          <p className="landing-about-text">{t("landing.aboutText")}</p>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="landing-section">
        <h2 className="landing-h2">{t("landing.problemTitle")}</h2>
        <p className="landing-section-sub">{t("landing.problemSub")}</p>
        <div className="landing-features">
          {PROBLEMS.map((p) => (
            <div className="landing-feature" key={p.key}>
              <div className="lf-icon" style={{ background: `${p.color}1A`, color: p.color }}>{p.icon}</div>
              <div className="lf-title">{t(`landing.${p.key}Title`)}</div>
              <div className="lf-desc">{t(`landing.${p.key}Desc`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-section landing-tech-section">
        <h2 className="landing-h2">{t("landing.howTitle")}</h2>
        <div className="landing-steps">
          {STEPS.map((s, i) => (
            <div className="landing-step" key={s.key}>
              <div className="ls-num">{i + 1}</div>
              <div className="ls-icon">{s.icon}</div>
              <div className="lf-title">{t(`landing.${s.key}Title`)}</div>
              <div className="lf-desc">{t(`landing.${s.key}Desc`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="landing-section">
        <h2 className="landing-h2">{t("landing.audienceTitle")}</h2>
        <div className="landing-features">
          {AUDIENCE.map((a) => (
            <div className="landing-feature" key={a.key}>
              <div className="lf-icon" style={{ background: `${a.color}1A`, color: a.color }}>{a.icon}</div>
              <div className="lf-title">{t(`landing.${a.key}Title`)}</div>
              <div className="lf-desc">{t(`landing.${a.key}Desc`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-section">
        <h2 className="landing-h2">{t("landing.featuresTitle")}</h2>
        <p className="landing-section-sub">{t("landing.featuresSubtitle")}</p>
        <div className="landing-features">
          {FEATURES.map((f) => (
            <div className="landing-feature" key={f.key}>
              <div className="lf-icon" style={{ background: `${f.color}1A`, color: f.color }}>{f.icon}</div>
              <div className="lf-title">{t(`landing.${f.key}Title`)}</div>
              <div className="lf-desc">{t(`landing.${f.key}Desc`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TECH */}
      <section className="landing-section landing-tech-section">
        <h2 className="landing-h2">{t("landing.techTitle")}</h2>
        <div className="landing-tech">
          {TECH.map((tch) => <span className="landing-tech-badge" key={tch}>{tch}</span>)}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-brand">
          <div className="landing-logo"><SafetyOutlined /></div>
          <span>{t("common.appName")}</span>
        </div>
        <div style={{ opacity: 0.6, fontSize: 13 }}>{t("landing.footer")}</div>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="landing-footer-gh">
          <GithubOutlined /> GitHub
        </a>
      </footer>
    </div>
  );
}
