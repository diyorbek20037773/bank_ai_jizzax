import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { I18nProvider } from "./i18n/I18nProvider";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AssetList from "./pages/AssetList";
import AssetDetail from "./pages/AssetDetail";
import AssetForm from "./pages/AssetCreate";
import QRScanPage from "./pages/QRScanPage";
import Directory from "./pages/Directory";
import AuditLog from "./pages/AuditLog";
import AIAnalytics from "./pages/AIAnalytics";
import MyAssets from "./pages/MyAssets";
import AdminRequests from "./pages/AdminRequests";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const isUser = user?.role === "user";

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* USER roli — faqat o'z aktivlari va QR scan */}
        {isUser ? (
          <>
            <Route path="/" element={<MyAssets />} />
            <Route path="/my-assets" element={<MyAssets />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/scan" element={<QRScanPage />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<AssetList />} />
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/assets/:id/edit" element={<AssetForm />} />
            <Route path="/requests" element={<AdminRequests />} />
            <Route path="/scan" element={<QRScanPage />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/ai-analytics" element={<AIAnalytics />} />
<Route path="/audit-log" element={<AuditLog />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const buildTheme = (dark: boolean) => ({
  algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: "#1677FF",
    colorInfo: "#1677FF",
    colorSuccess: "#52C41A",
    colorWarning: "#FAAD14",
    colorError: "#FF4D4F",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    colorBgLayout: dark ? "#0A0A0A" : "#F0F2F5",
    controlHeight: 40,
    controlHeightLG: 48,
    motion: true,
    motionDurationFast: "0.15s",
    motionDurationMid: "0.25s",
    motionDurationSlow: "0.35s",
    motionEaseInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    motionEaseOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  components: {
    Layout: {
      siderBg: "#001529",
      headerBg: dark ? "#1A1A1A" : "#FFFFFF",
      bodyBg: dark ? "#0A0A0A" : "#F0F2F5",
      headerHeight: 64,
    },
    Menu: {
      darkItemBg: "transparent",
      darkItemSelectedBg: "rgba(22,119,255,0.15)",
      darkItemColor: "rgba(255,255,255,0.50)",
      darkItemHoverColor: "#FFFFFF",
      darkItemSelectedColor: "#FFFFFF",
      itemBorderRadius: 10,
      itemMarginBlock: 3,
    },
    Card: { borderRadiusLG: 14, paddingLG: 24 },
    Button: { borderRadius: 10, fontWeight: 500, controlHeight: 40 },
    Input: { borderRadius: 10, controlHeight: 40 },
    Table: {
      headerBg: dark ? "#1D1D1D" : "#FAFBFC",
      headerColor: dark ? "#9A9A9A" : "#8C8C8C",
      rowHoverBg: dark ? "rgba(22,119,255,0.10)" : "#F0F7FF",
      borderColor: dark ? "#2A2A2A" : "#F5F5F5",
      headerBorderRadius: 10,
      cellPaddingBlock: 14,
    },
    Select: { borderRadius: 10 },
    Modal: { borderRadiusLG: 18 },
    Statistic: { titleFontSize: 13, contentFontSize: 28 },
    Tag: { borderRadiusSM: 6 },
    Tabs: { inkBarColor: "#1677FF", itemActiveColor: "#1677FF", itemSelectedColor: "#1677FF" },
    Tooltip: { borderRadius: 8 },
    Popover: { borderRadiusLG: 14 },
  },
});

function ThemedApp() {
  const { mode } = useTheme();
  return (
    <ConfigProvider theme={buildTheme(mode === "dark")}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ThemedApp />
      </I18nProvider>
    </ThemeProvider>
  );
}
