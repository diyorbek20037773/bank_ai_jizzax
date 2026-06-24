import { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Tag, Badge, Tooltip, Select } from "antd";
import {
  DashboardOutlined, LaptopOutlined, ScanOutlined,
  DatabaseOutlined, AuditOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  SafetyOutlined, RobotOutlined, BellOutlined,
  SendOutlined, GithubOutlined, BulbOutlined, BulbFilled, FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useT } from "../../i18n/I18nProvider";
import { LANGS, LANG_SHORT, type Lang } from "../../i18n/resources";
import { getPendingCount } from "../../api";
import AIChatbot from "../ai/AIChatbot";

const { Header, Sider, Content } = Layout;

const GITHUB_URL = "https://github.com/diyorbek20037773/bank_ai_jizzax";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggle } = useTheme();
  const { t, lang, setLang } = useT();

  const isUser = user?.role === "user";
  const isAdmin = user?.role === "admin";
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      const fetchPending = () => {
        getPendingCount().then(({ data }) => setPendingRequests(data.count)).catch(() => {});
      };
      fetchPending();
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const adminMenuItems = [
    { key: "/", icon: <DashboardOutlined />, label: t("menu.dashboard") },
    { key: "/assets", icon: <LaptopOutlined />, label: t("menu.assets") },
    {
      key: "/requests",
      icon: <SendOutlined />,
      label: <span>{t("menu.requests")} {pendingRequests > 0 && <Badge count={pendingRequests} size="small" style={{ marginLeft: 6 }} />}</span>,
    },
    { key: "/scan", icon: <ScanOutlined />, label: t("menu.qrScan") },
    { type: "divider" as const },
    { key: "/directory", icon: <DatabaseOutlined />, label: t("menu.data") },
    { key: "/ai-analytics", icon: <RobotOutlined />, label: t("menu.aiAnalysis") },
    { key: "/ai-report", icon: <FileTextOutlined />, label: t("menu.aiReport") },
    { key: "/audit-log", icon: <AuditOutlined />, label: t("menu.auditLog") },
  ];

  const userMenuItems = [
    { key: "/", icon: <LaptopOutlined />, label: t("menu.myAssets") },
    { key: "/scan", icon: <ScanOutlined />, label: t("menu.qrScan") },
  ];

  const menuItems = isUser ? userMenuItems : adminMenuItems;

  const roleLabels: Record<string, string> = {
    admin: t("common.roleAdmin"),
    user: t("common.roleUser"),
  };

  const roleColors: Record<string, string> = {
    admin: "#f5222d",
    user: "#52c41a",
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        collapsedWidth={0}
        className="app-sidebar"
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
      >
        <div className="sidebar-logo">
          <div className="logo-box">
            <SafetyOutlined />
          </div>
          {!collapsed && <span className="logo-text">Bankir AI</span>}
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAdmin && pendingRequests > 0 && (
            <Tooltip title={t("menu.requests")}>
              <Badge count={pendingRequests} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={(e) => { e.stopPropagation(); navigate("/requests"); }}
                  style={{ color: "#FA8C16" }}
                />
              </Badge>
            </Tooltip>
          )}

          <Select
            value={lang}
            onChange={(l) => setLang(l as Lang)}
            size="small"
            variant="borderless"
            popupMatchSelectWidth={false}
            className="lang-select"
            options={LANGS.map((l) => ({ value: l, label: LANG_SHORT[l] }))}
          />

          <Tooltip title={t("common.theme")}>
            <Button
              type="text"
              aria-label="toggle theme"
              icon={mode === "dark" ? <BulbFilled style={{ fontSize: 18, color: "#FAAD14" }} /> : <BulbOutlined style={{ fontSize: 18 }} />}
              onClick={toggle}
            />
          </Tooltip>

          <Tooltip title={t("common.sourceCode")}>
            <Button
              type="text"
              aria-label="github"
              icon={<GithubOutlined style={{ fontSize: 19 }} />}
              href={GITHUB_URL}
              target="_blank"
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: "info",
                  label: (
                    <div style={{ padding: "6px 0" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{user?.full_name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{user?.email || user?.username}</div>
                    </div>
                  ),
                  disabled: true,
                },
                { type: "divider" },
                { key: "logout", icon: <LogoutOutlined />, label: t("common.logout"), danger: true, onClick: logout },
              ],
            }}
            placement="bottomRight"
          >
            <div className="header-user-btn">
              <Avatar
                size={38}
                style={{
                  background: "linear-gradient(135deg, #0958D9, #1677FF)",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  {user?.full_name}
                </div>
                <Tag
                  color={roleColors[user?.role || ""] || "default"}
                  style={{ fontSize: 10, lineHeight: "16px", margin: 0, padding: "0 7px", borderRadius: 4, fontWeight: 600, letterSpacing: "0.04em" }}
                >
                  {roleLabels[user?.role || ""] || user?.role?.toUpperCase()}
                </Tag>
              </div>
            </div>
          </Dropdown>
          </div>
        </Header>
        <Content className="content-area">
          <Outlet />
        </Content>
      </Layout>
      <AIChatbot />
    </Layout>
  );
}
