import { useState } from "react";
import {
  Card, Button, Spin, Tag, Typography, Progress, Row, Col, Empty, Tooltip,
} from "antd";
import {
  RobotOutlined, BulbOutlined,
  WarningOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, InfoCircleOutlined,
  SafetyOutlined, ArrowRightOutlined,
  ReloadOutlined, ClockCircleOutlined,
  SyncOutlined, FireOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { aiInsights, aiRiskAssessment, aiProblematicAssets } from "../api";
import { useT } from "../i18n/I18nProvider";

type InsightItem = { type: string; title: string; description: string; priority: string };
type RiskAsset = { id: number; name: string; risk_score: number; risk_level: string; recommendation: string; predicted_failure?: string };
type ProblemAsset = { id: number; name: string; inventory_number: string; problem_type: string; severity: string; reason: string; recommendation: string };

const PRIORITY_COLORS: Record<string, string> = { high: "red", medium: "orange", low: "blue" };
const SEVERITY_COLORS: Record<string, string> = { yuqori: "red", "o'rta": "orange", past: "green" };
const RISK_COLORS: Record<string, string> = { past: "#52C41A", "o'rta": "#FAAD14", yuqori: "#FA8C16", kritik: "#FF4D4F" };

const AI_MODULES = [
  {
    key: "insights",
    icon: <BulbOutlined style={{ fontSize: 22 }} />,
    titleKey: "ai.insights.title",
    descKey: "ai.insights.desc",
    gradient: "linear-gradient(135deg, #FFF8E1 0%, #FFF3CD 100%)",
    borderColor: "#FFE082",
    iconBg: "linear-gradient(135deg, #FAAD14, #D48806)",
    accentColor: "#D48806",
  },
  {
    key: "risk",
    icon: <SafetyOutlined style={{ fontSize: 22 }} />,
    titleKey: "ai.risk.title",
    descKey: "ai.risk.desc",
    gradient: "linear-gradient(135deg, #FFF1F0 0%, #FFCCC7 100%)",
    borderColor: "#FFA39E",
    iconBg: "linear-gradient(135deg, #FF4D4F, #CF1322)",
    accentColor: "#CF1322",
  },
  {
    key: "problems",
    icon: <ExclamationCircleOutlined style={{ fontSize: 22 }} />,
    titleKey: "ai.problems.title",
    descKey: "ai.problems.desc",
    gradient: "linear-gradient(135deg, #FFF7E6 0%, #FFE7BA 100%)",
    borderColor: "#FFD591",
    iconBg: "linear-gradient(135deg, #FA8C16, #D46B08)",
    accentColor: "#D46B08",
  },
];

export default function AIAnalytics() {
  const navigate = useNavigate();
  const { t } = useT();

  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  const [riskAnalysis, setRiskAnalysis] = useState("");
  const [riskAssets, setRiskAssets] = useState<RiskAsset[]>([]);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskLoaded, setRiskLoaded] = useState(false);

  const [problemSummary, setProblemSummary] = useState("");
  const [problemAssets, setProblemAssets] = useState<ProblemAsset[]>([]);
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemLoaded, setProblemLoaded] = useState(false);

  const [error, setError] = useState("");

  const loadInsights = async () => {
    setInsightsLoading(true); setError("");
    try {
      const { data } = await aiInsights();
      setInsights(data.insights || []); setInsightsLoaded(true);
    } catch (e: any) { setError(e.response?.data?.detail || t("ai.insights.loadError")); }
    setInsightsLoading(false);
  };

  const loadRisk = async () => {
    setRiskLoading(true); setError("");
    try {
      const { data } = await aiRiskAssessment();
      setRiskAnalysis(data.analysis || ""); setRiskAssets(data.assets || []); setRiskLoaded(true);
    } catch (e: any) { setError(e.response?.data?.detail || t("ai.risk.loadError")); }
    setRiskLoading(false);
  };

  const loadProblematic = async () => {
    setProblemLoading(true); setError("");
    try {
      const { data } = await aiProblematicAssets();
      setProblemSummary(data.summary || ""); setProblemAssets(data.problematic_assets || []); setProblemLoaded(true);
    } catch (e: any) { setError(e.response?.data?.detail || t("ai.problems.loadError")); }
    setProblemLoading(false);
  };

  const loaders = [loadInsights, loadRisk, loadProblematic];
  const loadingStates = [insightsLoading, riskLoading, problemLoading];
  const loadedStates = [insightsLoaded, riskLoaded, problemLoaded];
  const resultCounts = [insights.length, riskAssets.length, problemAssets.length];

  const getModuleStatus = (idx: number) => {
    if (loadingStates[idx]) return <Tag icon={<SyncOutlined spin />} color="processing" style={{ margin: 0, borderRadius: 6 }}>{t("ai.statusAnalyzing")}</Tag>;
    if (loadedStates[idx]) return <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0, borderRadius: 6 }}>{t("ai.statusResults", { n: resultCounts[idx] })}</Tag>;
    return <Tag icon={<ClockCircleOutlined />} style={{ margin: 0, borderRadius: 6, color: "#8C8C8C" }}>{t("ai.statusStart")}</Tag>;
  };

  return (
    <div className="animate-in">

      {/* ── ERROR ── */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "#FFF2F0", border: "1px solid #FFCCC7",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: "#CF1322", fontSize: 13 }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />{error}
          </span>
          <Button size="small" onClick={() => setError("")}>{t("common.close")}</Button>
        </div>
      )}

      {/* ── 3 MODULE CARDS ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {AI_MODULES.map((mod, idx) => (
          <Col xs={24} md={8} key={mod.key}>
            <div
              onClick={() => { if (!loadingStates[idx]) loaders[idx](); }}
              style={{
                background: loadedStates[idx] ? "#fff" : mod.gradient,
                border: `1.5px solid ${loadedStates[idx] ? "#E8E8E8" : mod.borderColor}`,
                borderRadius: 16, padding: "22px 18px",
                cursor: loadingStates[idx] ? "wait" : "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                height: "100%", display: "flex", flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                if (!loadingStates[idx]) {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: mod.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", boxShadow: `0 4px 12px ${mod.accentColor}40`,
                }}>
                  {mod.icon}
                </div>
                {getModuleStatus(idx)}
              </div>

              <Typography.Text strong style={{ fontSize: 15, color: "#141414", marginBottom: 6, display: "block" }}>
                {t(mod.titleKey)}
              </Typography.Text>
              <Typography.Text style={{ fontSize: 12.5, color: "#595959", flex: 1 }}>
                {t(mod.descKey)}
              </Typography.Text>

              {!loadedStates[idx] && !loadingStates[idx] && (
                <div style={{
                  marginTop: 14, padding: "7px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.6)", textAlign: "center",
                  border: `1px dashed ${mod.borderColor}`,
                }}>
                  <FireOutlined style={{ color: mod.accentColor, marginRight: 6 }} />
                  <Typography.Text style={{ fontSize: 12, color: mod.accentColor, fontWeight: 500 }}>
                    {t("ai.clickToStart")}
                  </Typography.Text>
                </div>
              )}

              {loadingStates[idx] && (
                <div style={{ marginTop: 14, textAlign: "center" }}>
                  <Spin size="small" />
                </div>
              )}

              {loadedStates[idx] && !loadingStates[idx] && (
                <div style={{
                  marginTop: 14, padding: "6px 10px", borderRadius: 8,
                  background: "#F6FFED", border: "1px solid #B7EB8F",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12, color: "#389E0D" }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />{t("ai.statusResults", { n: resultCounts[idx] })}
                  </span>
                  <Tooltip title={t("ai.reanalyze")}>
                    <ReloadOutlined
                      style={{ color: "#8C8C8C", cursor: "pointer", fontSize: 12 }}
                      onClick={(e) => { e.stopPropagation(); loaders[idx](); }}
                    />
                  </Tooltip>
                </div>
              )}
            </div>
          </Col>
        ))}
      </Row>

      {/* ══════ 1. TAVSIYALAR ══════ */}
      {insightsLoaded && (
        <Card
          style={{ marginBottom: 20, borderRadius: 14, borderTop: "3px solid #FAAD14" }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <BulbOutlined style={{ fontSize: 20, color: "#FAAD14" }} />
            <Typography.Text strong style={{ fontSize: 15 }}>{t("ai.insights.title")}</Typography.Text>
            <Tag color="gold" style={{ borderRadius: 6, fontSize: 11 }}>{t("ai.countSuffix", { n: insights.length })}</Tag>
          </div>

          {insights.length === 0 ? (
            <Empty description={t("ai.insights.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, padding: "12px 14px", borderRadius: 10,
                  background: "#FAFAFA", border: "1px solid #F0F0F0",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: item.type === "warning" ? "#FFF7E6" : item.type === "success" ? "#F6FFED" : "#E6F4FF",
                    color: item.type === "warning" ? "#FA8C16" : item.type === "success" ? "#52C41A" : "#1677FF",
                    fontSize: 15,
                  }}>
                    {item.type === "warning" ? <WarningOutlined /> : item.type === "success" ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</span>
                      <Tag color={PRIORITY_COLORS[item.priority]} style={{ fontSize: 10, borderRadius: 4 }}>{item.priority}</Tag>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#595959", lineHeight: 1.5 }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ══════ 2. NOSOZLIK XAVFI ══════ */}
      {riskLoaded && (
        <Card
          style={{ marginBottom: 20, borderRadius: 14, borderTop: "3px solid #FF4D4F" }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <SafetyOutlined style={{ fontSize: 20, color: "#FF4D4F" }} />
            <Typography.Text strong style={{ fontSize: 15 }}>{t("ai.risk.title")}</Typography.Text>
            <Tag color="red" style={{ borderRadius: 6, fontSize: 11 }}>{t("ai.countSuffix", { n: riskAssets.length })}</Tag>
          </div>

          {riskAnalysis && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 14,
              background: "#FFF1F0", border: "1px solid #FFCCC7", fontSize: 12.5, color: "#434343",
            }}>
              <RobotOutlined style={{ color: "#722ED1", marginRight: 8 }} />
              {riskAnalysis}
            </div>
          )}

          {riskAssets.length === 0 ? (
            <Empty description={t("ai.risk.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Row gutter={[12, 12]}>
              {riskAssets.map((asset) => (
                <Col xs={24} sm={12} md={8} key={asset.id}>
                  <div
                    style={{
                      padding: 14, borderRadius: 10,
                      border: "1px solid #F0F0F0",
                      borderLeft: `4px solid ${RISK_COLORS[asset.risk_level] || "#D9D9D9"}`,
                      background: "#fff", cursor: "pointer", transition: "all 0.2s",
                    }}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Typography.Text strong ellipsis style={{ fontSize: 13, maxWidth: "65%" }}>{asset.name}</Typography.Text>
                      <Tag color={RISK_COLORS[asset.risk_level]} style={{ fontSize: 11, borderRadius: 6 }}>{asset.risk_level}</Tag>
                    </div>
                    <Progress
                      percent={asset.risk_score} size="small" showInfo={false}
                      strokeColor={asset.risk_score >= 70 ? "#FF4D4F" : asset.risk_score >= 50 ? "#FA8C16" : asset.risk_score >= 30 ? "#FAAD14" : "#52C41A"}
                      style={{ marginBottom: 6 }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#8C8C8C" }}>{t("ai.risk.label")}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: RISK_COLORS[asset.risk_level] }}>{asset.risk_score}%</span>
                    </div>
                    {asset.predicted_failure && (
                      <div style={{ fontSize: 11, color: "#CF1322", padding: "3px 6px", borderRadius: 4, background: "#FFF1F0", marginBottom: 4 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />{asset.predicted_failure}
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, color: "#595959" }}>{asset.recommendation}</div>
                    <div style={{ marginTop: 6, fontSize: 11, color: "#1677FF" }}>
                      <ArrowRightOutlined style={{ marginRight: 4 }} />{t("ai.details")}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      )}

      {/* ══════ 3. MUAMMOLI AKTIVLAR ══════ */}
      {problemLoaded && (
        <Card
          style={{ marginBottom: 20, borderRadius: 14, borderTop: "3px solid #FA8C16" }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <ExclamationCircleOutlined style={{ fontSize: 20, color: "#FA8C16" }} />
            <Typography.Text strong style={{ fontSize: 15 }}>{t("ai.problems.title")}</Typography.Text>
            <Tag color="orange" style={{ borderRadius: 6, fontSize: 11 }}>{t("ai.countSuffix", { n: problemAssets.length })}</Tag>
          </div>

          {problemSummary && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 14,
              background: "#FFF7E6", border: "1px solid #FFE58F", fontSize: 12.5, color: "#434343",
            }}>
              <RobotOutlined style={{ color: "#722ED1", marginRight: 8 }} />
              {problemSummary}
            </div>
          )}

          {problemAssets.length === 0 ? (
            <Empty description={t("ai.problems.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {problemAssets.map((asset, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: 12, padding: "12px 14px", borderRadius: 10,
                    background: "#fff", border: "1px solid #F0F0F0", cursor: "pointer",
                    borderLeft: `4px solid ${SEVERITY_COLORS[asset.severity] || "#FA8C16"}`,
                    transition: "all 0.2s",
                  }}
                  onClick={() => navigate(`/assets/${asset.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFAFA"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${SEVERITY_COLORS[asset.severity] || "#FA8C16"}15`,
                  }}>
                    <WarningOutlined style={{ fontSize: 16, color: SEVERITY_COLORS[asset.severity] || "#FA8C16" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{asset.name}</span>
                      <span style={{ fontSize: 11, color: "#0958D9", fontFamily: "monospace" }}>{asset.inventory_number}</span>
                      <Tag color={SEVERITY_COLORS[asset.severity]} style={{ fontSize: 10, borderRadius: 4 }}>{asset.severity}</Tag>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#595959", marginBottom: 4 }}>{asset.reason}</div>
                    <div style={{ fontSize: 12, color: "#1677FF", fontWeight: 500 }}>
                      <ArrowRightOutlined style={{ marginRight: 4 }} />{asset.recommendation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
