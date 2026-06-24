import { useState } from "react";
import { Button, Card, Empty, Spin, Typography, Row, Col, message } from "antd";
import {
  FileTextOutlined, ThunderboltOutlined, DownloadOutlined,
  BulbOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { aiReport } from "../api";
import { useT } from "../i18n/I18nProvider";

interface ReportData {
  title: string;
  summary: string;
  key_metrics: { label: string; value: string }[];
  sections: { heading: string; body: string }[];
  recommendations: string[];
}

export default function AIReport() {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await aiReport();
      setReport(data);
    } catch {
      message.error(t("report.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg, #722ED1, #531DAB)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileTextOutlined style={{ color: "#fff", fontSize: 20 }} />
          </div>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>{t("report.title")}</Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t("report.subtitle")}</Typography.Text>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {report && (
            <Button icon={<DownloadOutlined />} onClick={() => window.print()}>
              {t("report.downloadPdf")}
            </Button>
          )}
          <Button
            type="primary"
            icon={loading ? undefined : <ThunderboltOutlined />}
            loading={loading}
            onClick={generate}
            style={{ background: "linear-gradient(135deg, #722ED1, #531DAB)", borderColor: "#722ED1" }}
          >
            {report ? t("report.regenerate") : t("report.generate")}
          </Button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 16 }}>
          <Spin size="large" />
          <Typography.Text type="secondary">{t("report.generating")}</Typography.Text>
        </div>
      )}

      {!loading && !report && (
        <Card style={{ marginTop: 8 }}>
          <Empty
            description={
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("report.emptyTitle")}</div>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t("report.emptyHint")}</Typography.Text>
              </div>
            }
          />
        </Card>
      )}

      {!loading && report && (
        <div className="report-doc">
          <Card className="report-card">
            {/* Title */}
            <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid var(--border-light)" }}>
              <Typography.Title level={3} style={{ margin: 0 }}>{report.title}</Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t("common.appName")} · {t("report.poweredBy")}
              </Typography.Text>
            </div>

            {/* Summary */}
            <Typography.Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>{report.summary}</Typography.Paragraph>

            {/* Key metrics */}
            {report.key_metrics?.length > 0 && (
              <>
                <Typography.Title level={5} style={{ marginTop: 16 }}>{t("report.keyMetrics")}</Typography.Title>
                <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
                  {report.key_metrics.map((m, i) => (
                    <Col xs={12} sm={8} md={6} key={i}>
                      <div style={{
                        padding: "14px 16px", borderRadius: 12,
                        background: "var(--bg-subtle)", border: "1px solid var(--border-light)",
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{m.value}</div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{m.label}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* Sections */}
            {report.sections?.map((s, i) => (
              <div key={i} style={{ marginTop: 18 }}>
                <Typography.Title level={5} style={{ marginBottom: 6 }}>
                  <BulbOutlined style={{ color: "#722ED1", marginRight: 8 }} />{s.heading}
                </Typography.Title>
                <Typography.Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                  {s.body}
                </Typography.Paragraph>
              </div>
            ))}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>{t("report.recommendations")}</Typography.Title>
                {report.recommendations.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: "#52C41A", marginTop: 4 }} />
                    <span style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
