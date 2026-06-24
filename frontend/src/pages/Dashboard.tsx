import { useEffect, useState } from "react";
import { Row, Col, Card, Spin, Progress } from "antd";
import {
  LaptopOutlined, CheckCircleOutlined, ToolOutlined,
  ExclamationCircleOutlined, DollarOutlined,
  InboxOutlined, StopOutlined,
} from "@ant-design/icons";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { getOverview, getByCategory, getByStatus, getByDepartment } from "../api";
import type { OverviewStats, CategoryStat, StatusStat, DepartmentStat } from "../types";
import { STATUS_COLORS } from "../utils/constants";
import { useT } from "../i18n/I18nProvider";

const CHART_COLORS = ["#0958D9", "#52C41A", "#FA8C16", "#FF4D4F", "#722ED1", "#13C2C2", "#EB2F96", "#FAAD14", "#2F54EB", "#A0D911", "#36CFC9", "#597EF7"];

const formatValue = (value: number | string | undefined) => {
  const num = Number(value || 0);
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} mlrd`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} mln`;
  if (num >= 1_000) return num.toLocaleString("ru-RU");
  return String(num);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border-light)", borderRadius: 10,
      padding: "12px 16px", boxShadow: "var(--shadow-md)",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.01em" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: 13, color: p.color || "var(--text-secondary)", lineHeight: 1.6 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const statusMeta = [
  { key: "registered", code: "REGISTERED", icon: <InboxOutlined />, color: "#722ED1", bg: "#F9F0FF" },
  { key: "assigned", code: "ASSIGNED", icon: <CheckCircleOutlined />, color: "#52C41A", bg: "#F6FFED" },
  { key: "in_repair", code: "IN_REPAIR", icon: <ToolOutlined />, color: "#FA8C16", bg: "#FFF7E6" },
  { key: "lost", code: "LOST", icon: <ExclamationCircleOutlined />, color: "#FF4D4F", bg: "#FFF2F0" },
  { key: "written_off", code: "WRITTEN_OFF", icon: <StopOutlined />, color: "#D4A843", bg: "#FFFBE6" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useT();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [byCategory, setByCategory] = useState<CategoryStat[]>([]);
  const [byStatus, setByStatus] = useState<StatusStat[]>([]);
  const [byDepartment, setByDepartment] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getByCategory(), getByStatus(), getByDepartment()])
      .then(([ov, cat, st, dep]) => {
        setOverview(ov.data);
        setByCategory(cat.data);
        setByStatus(st.data);
        setByDepartment(dep.data.slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: 400, gap: 16 }}>
        <Spin size="large" />
        <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 450 }}>{t("common.loadingData")}</span>
      </div>
    );
  }

  const total = overview?.total_assets || 0;
  const totalValue = Number(overview?.total_value || 0);
  const assigned = overview?.assigned || 0;
  const assignedPercent = total > 0 ? Math.round((assigned / total) * 100) : 0;

  const statusData = byStatus.map((s) => ({
    ...s,
    name: t(`common.statuses.${s.status}`),
    fill: STATUS_COLORS[s.status] || "#8c8c8c",
  }));

  return (
    <div className="animate-in">
      {/* ── Hero KPI Row ── */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={8}>
          <div
            className="dash-hero-card"
            style={{ background: "linear-gradient(135deg, #0958D9 0%, #1677FF 100%)" }}
            onClick={() => navigate("/assets")}
          >
            <div className="dash-hero-icon" style={{ background: "rgba(255,255,255,0.18)" }}>
              <LaptopOutlined style={{ color: "#fff", fontSize: 24 }} />
            </div>
            <div className="dash-hero-value" style={{ color: "#fff" }}>{total}</div>
            <div className="dash-hero-label" style={{ color: "rgba(255,255,255,0.7)" }}>{t("dashboard.totalAssets")}</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="dash-hero-card" style={{ background: "linear-gradient(135deg, #389E0D 0%, #52C41A 100%)" }}>
            <div className="dash-hero-icon" style={{ background: "rgba(255,255,255,0.18)" }}>
              <DollarOutlined style={{ color: "#fff", fontSize: 24 }} />
            </div>
            <div className="dash-hero-value" style={{ color: "#fff" }}>
              {formatValue(totalValue)} <span style={{ fontSize: 14, fontWeight: 500 }}>{t("common.currency")}</span>
            </div>
            <div className="dash-hero-label" style={{ color: "rgba(255,255,255,0.7)" }}>{t("dashboard.totalValue")}</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="dash-hero-card" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Progress
                type="circle"
                percent={assignedPercent}
                size={72}
                strokeColor="#1677FF"
                trailColor="var(--border-light)"
                format={(p) => <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{p}%</span>}
              />
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{assigned}/{total}</div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{t("dashboard.assigned")}</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Status Mini Cards ── */}
      <Row gutter={[14, 14]} style={{ marginTop: 20 }}>
        {statusMeta.map((s) => {
          const val = (overview as any)?.[s.key] || 0;
          return (
            <Col xs={12} sm={8} md={4} lg={4} xl={4} key={s.key}>
              <div className="dash-status-card" onClick={() => navigate(`/assets?status=${s.key.toUpperCase()}`)}>
                <div className="dash-status-icon" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <div className="dash-status-value">{val}</div>
                <div className="dash-status-label">{t(`common.statuses.${s.code}`)}</div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* ── Charts Row ── */}
      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title={t("dashboard.byCategory")}
            styles={{ body: { padding: "16px 24px 24px" } }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="count"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={105}
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke="none"
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span style={{ color: "#595959", fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title={t("dashboard.byStatus")}
            styles={{ body: { padding: "16px 24px 24px" } }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#8C8C8C" }}
                  axisLine={{ stroke: "#F0F0F0" }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#8C8C8C" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name={t("dashboard.count")} radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ── Department Chart ── */}
      {byDepartment.length > 0 && (
        <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card
              className="chart-card"
              title={t("dashboard.byDepartment")}
              styles={{ body: { padding: "16px 24px 24px" } }}
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={byDepartment} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#8C8C8C" }}
                    axisLine={{ stroke: "#F0F0F0" }}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="department_name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12, fill: "#595959" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name={t("dashboard.assetsCount")} radius={[0, 6, 6, 0]}>
                    {byDepartment.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
