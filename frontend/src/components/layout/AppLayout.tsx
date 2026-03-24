import { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Tag, Badge, Tooltip } from "antd";
import {
  DashboardOutlined, LaptopOutlined, ScanOutlined,
  DatabaseOutlined, AuditOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  SafetyOutlined, RobotOutlined, BellOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPendingCount } from "../../api";
import AIChatbot from "../ai/AIChatbot";

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
    { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/assets", icon: <LaptopOutlined />, label: "Aktivlar" },
    {
      key: "/requests",
      icon: <Badge count={pendingRequests} size="small" offset={[6, 0]}><SendOutlined /></Badge>,
      label: <span>So'rovlar {pendingRequests > 0 && <Badge count={pendingRequests} size="small" style={{ marginLeft: 6 }} />}</span>,
    },
    { key: "/scan", icon: <ScanOutlined />, label: "QR Skan" },
    { type: "divider" as const },
    { key: "/directory", icon: <DatabaseOutlined />, label: "Ma'lumotlar" },
    { key: "/ai-analytics", icon: <RobotOutlined />, label: "AI Tahlil" },
    { key: "/audit-log", icon: <AuditOutlined />, label: "Audit Log" },
  ];

  const userMenuItems = [
    { key: "/", icon: <LaptopOutlined />, label: "Mening aktivlarim" },
    { key: "/scan", icon: <ScanOutlined />, label: "QR Skan" },
  ];

  const menuItems = isUser ? userMenuItems : adminMenuItems;

  const roleLabels: Record<string, string> = {
    admin: "ADMIN",
    user: "XODIM",
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
        className="app-sidebar"
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
      >
        <div className="sidebar-logo">
          <div className="logo-box">
            <SafetyOutlined />
          </div>
          {!collapsed && <span className="logo-text">Bank Assets</span>}
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
            <Tooltip title={`${pendingRequests} ta yangi so'rov`}>
              <Badge count={pendingRequests} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={() => navigate("/requests")}
                  style={{ color: "#FA8C16" }}
                />
              </Badge>
            </Tooltip>
          )}
          <Dropdown
            menu={{
              items: [
                {
                  key: "info",
                  label: (
                    <div style={{ padding: "6px 0" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#141414" }}>{user?.full_name}</div>
                      <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>{user?.email || user?.username}</div>
                    </div>
                  ),
                  disabled: true,
                },
                { type: "divider" },
                { key: "logout", icon: <LogoutOutlined />, label: "Tizimdan chiqish", danger: true, onClick: logout },
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
                <div style={{ fontWeight: 600, fontSize: 13, color: "#141414", letterSpacing: "-0.01em" }}>
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
      {isAdmin && <AIChatbot />}
    </Layout>
  );
}
