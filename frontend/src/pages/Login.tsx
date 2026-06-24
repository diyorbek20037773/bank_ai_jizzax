import { useState } from "react";
import { Form, Input, Button, message, Select } from "antd";
import { UserOutlined, LockOutlined, SafetyOutlined, GlobalOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/I18nProvider";
import { LANGS, LANG_LABELS, type Lang } from "../i18n/resources";
import { login as loginApi } from "../api";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, lang, setLang } = useT();
  const [form] = Form.useForm();

  const demoUsers = [
    { username: "admin", password: "admin123", role: t("login.roleAdmin"), color: "#FF4D4F" },
    { username: "user", password: "user123", role: t("login.roleUser"), color: "#52C41A" },
  ];

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await loginApi(values.username, values.password);
      login(data.access_token, data.user);
      message.success(`${t("login.welcome")}, ${data.user.full_name}!`);
      navigate("/");
    } catch {
      message.error(t("login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (username: string, password: string) => {
    form.setFieldsValue({ username, password });
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-lang-switch">
        <Select
          value={lang}
          onChange={(l) => setLang(l as Lang)}
          variant="borderless"
          suffixIcon={<GlobalOutlined style={{ color: "rgba(255,255,255,0.55)" }} />}
          popupMatchSelectWidth={false}
          options={LANGS.map((l) => ({ value: l, label: LANG_LABELS[l] }))}
        />
      </div>

      <div className="login-card">
        <div className="login-card-header">
          <div className="login-card-icon">
            <SafetyOutlined />
          </div>
          <h2>{t("common.appName")}</h2>
          <p>{t("login.subtitle")}</p>
        </div>

        <Form form={form} onFinish={onFinish} autoComplete="off" className="login-form">
          <Form.Item name="username" rules={[{ required: true, message: t("login.usernameRequired") }]}>
            <Input prefix={<UserOutlined />} placeholder={t("login.username")} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t("login.passwordRequired") }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t("login.password")} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t("login.loginBtn")}
            </Button>
          </Form.Item>
        </Form>

        <div className="demo-divider">
          <span>{t("login.quickLogin")}</span>
        </div>

        <div className="demo-buttons">
          {demoUsers.map((u) => (
            <button
              key={u.username}
              className="demo-btn"
              onClick={() => fillDemo(u.username, u.password)}
              type="button"
            >
              <span className="demo-btn-dot" style={{ background: u.color }} />
              <span className="demo-btn-name">{u.username}</span>
              <span className="demo-btn-role">{u.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
