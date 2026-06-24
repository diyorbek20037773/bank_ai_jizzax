import { useState, useEffect, useRef } from "react";
import { Typography, message, Button, Input, Space, Card, Tag, Descriptions, Row, Col, Spin } from "antd";
import { ScanOutlined, SearchOutlined, UserOutlined, BankOutlined, ArrowRightOutlined, RobotOutlined } from "@ant-design/icons";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { qrLookup, getAssets, aiAssetSummary } from "../api";
import type { Asset } from "../types";
import { STATUS_CONFIG, STATUS_COLORS, API_BASE } from "../utils/constants";
import { useT } from "../i18n/I18nProvider";

export default function QRScanPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [sampleAssets, setSampleAssets] = useState<Asset[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    getAssets({ page: 1, page_size: 3 })
      .then((res) => setSampleAssets(res.data.items || res.data))
      .catch(() => {})
      .finally(() => setSamplesLoading(false));
  }, []);

  const handleScanResult = async (decodedText: string) => {
    const match = decodedText.match(/scan\/([A-Z0-9-]+)/i);
    const invNum = match ? match[1] : decodedText;

    try {
      const { data } = await qrLookup(invNum);
      message.success(t("qr.assetFound", { name: data.name }));
      stopScanning();
      setAiSummary(null);
      setFoundAsset(data);
    } catch {
      message.error(t("qr.assetNotFound"));
    }
  };

  const handleAiSummary = async (assetId: number) => {
    setSummaryLoading(true);
    try {
      const { data } = await aiAssetSummary(assetId);
      setAiSummary(data.summary);
    } catch {
      message.error(t("qr.aiSummaryError"));
    } finally {
      setSummaryLoading(false);
    }
  };

  const startScanning = async () => {
    setFoundAsset(null);
    setAiSummary(null);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => handleScanResult(text),
        () => {}
      );
      setScanning(true);
    } catch {
      message.error(t("qr.cameraError"));
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanning(); };
  }, []);

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;
    try {
      const { data } = await qrLookup(manualInput.trim());
      message.success(t("qr.assetFound", { name: data.name }));
      setAiSummary(null);
      setFoundAsset(data);
    } catch {
      message.error(t("qr.assetNotFound"));
    }
  };

  const handleSampleClick = async (asset: Asset) => {
    try {
      const { data } = await qrLookup(asset.inventory_number);
      message.success(t("qr.assetFound", { name: data.name }));
      setAiSummary(null);
      setFoundAsset(data);
    } catch {
      message.error(t("qr.assetNotFound"));
    }
  };

  return (
    <div className="animate-in">

      <div className="qr-scan-container">
        <div className="qr-scan-card">
          <div id="qr-reader" style={{ width: "100%", minHeight: scanning ? 300 : 0 }} />

          {!scanning && !foundAsset ? (
            <div className="qr-scan-prompt">
              <div className="scan-icon-box">
                <ScanOutlined />
              </div>
              <Typography.Title level={5} style={{ marginBottom: 8, color: "#141414" }}>
                {t("qr.scanTitle")}
              </Typography.Title>
              <Typography.Paragraph style={{ color: "#8C8C8C", marginBottom: 24 }}>
                {t("qr.scanPrompt")}
              </Typography.Paragraph>
              <Button type="primary" size="large" icon={<ScanOutlined />} onClick={startScanning}>
                {t("qr.startCamera")}
              </Button>
            </div>
          ) : scanning ? (
            <div style={{ textAlign: "center", padding: "16px 24px" }}>
              <Button danger onClick={stopScanning}>{t("qr.stopCamera")}</Button>
            </div>
          ) : null}

          {/* Topilgan aktiv kartasi */}
          {foundAsset && !scanning && (
            <div style={{ padding: "16px 24px" }}>
              <Card
                style={{ borderRadius: 12, border: `2px solid ${STATUS_COLORS[foundAsset.status] || "#d9d9d9"}` }}
                styles={{ body: { padding: "20px" } }}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    {foundAsset.photo_path ? (
                      <img
                        src={`${API_BASE}${foundAsset.photo_path}`}
                        alt={foundAsset.name}
                        style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #f0f0f0" }}
                      />
                    ) : (
                      <img
                        src={`${API_BASE}/api/assets/${foundAsset.id}/qrcode`}
                        alt="QR"
                        style={{ width: 120, height: 120, borderRadius: 8, border: "1px solid #f0f0f0", padding: 4 }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <Typography.Title level={5} style={{ margin: 0 }}>{foundAsset.name}</Typography.Title>
                      <Tag color={STATUS_CONFIG[foundAsset.status]?.color || "default"} style={{ borderRadius: 6, fontSize: 13 }}>
                        {STATUS_CONFIG[foundAsset.status]?.label || foundAsset.status}
                      </Tag>
                    </div>

                    <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
                      <Descriptions.Item label={t("qr.inventoryNumber")}>
                        <span style={{ fontWeight: 600, color: "#0958D9" }}>{foundAsset.inventory_number}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={t("common.category")}>
                        {foundAsset.category?.name || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("qr.serialNumber")}>
                        {foundAsset.serial_number}
                      </Descriptions.Item>
                    </Descriptions>

                    <div style={{
                      background: foundAsset.current_employee ? "#F6FFED" : "#FFF7E6",
                      borderRadius: 8, padding: "12px 16px", marginBottom: 12,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <UserOutlined style={{ color: foundAsset.current_employee ? "#52C41A" : "#FA8C16" }} />
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          {foundAsset.current_employee ? t("qr.currentOwner") : t("qr.notAssigned")}
                        </Typography.Text>
                      </div>
                      {foundAsset.current_employee ? (
                        <div style={{ paddingLeft: 24 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: "#141414" }}>
                            {foundAsset.current_employee.full_name}
                          </div>
                          {foundAsset.current_employee.position && (
                            <div style={{ fontSize: 13, color: "#595959" }}>{foundAsset.current_employee.position}</div>
                          )}
                          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                            {foundAsset.current_department && (
                              <span style={{ fontSize: 12, color: "#8C8C8C" }}>
                                <BankOutlined style={{ marginRight: 4 }} />
                                {foundAsset.current_department.name}
                              </span>
                            )}
                            {foundAsset.current_branch && (
                              <span style={{ fontSize: 12, color: "#8C8C8C" }}>
                                {foundAsset.current_branch.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ paddingLeft: 24, fontSize: 13, color: "#8C8C8C" }}>
                          {t("qr.notAssignedDesc")}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate(`/assets/${foundAsset.id}`)}>
                        {t("qr.viewDetails")}
                      </Button>
                      <Button
                        icon={<RobotOutlined />}
                        loading={summaryLoading}
                        onClick={() => handleAiSummary(foundAsset.id)}
                        style={{ borderColor: "#722ED1", color: "#722ED1" }}
                      >
                        {t("qr.aiSummaryBtn")}
                      </Button>
                      <Button onClick={() => { setFoundAsset(null); setManualInput(""); setAiSummary(null); }}>
                        {t("qr.rescan")}
                      </Button>
                    </div>

                    {(summaryLoading || aiSummary) && (
                      <div
                        style={{
                          marginTop: 14,
                          background: "linear-gradient(135deg, #F9F0FF 0%, #F0F5FF 100%)",
                          border: "1px solid #D3ADF7",
                          borderRadius: 10,
                          padding: "14px 16px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <RobotOutlined style={{ color: "#722ED1", fontSize: 16 }} />
                          <Typography.Text strong style={{ fontSize: 13, color: "#722ED1" }}>
                            {t("qr.aiSummaryTitle")}
                          </Typography.Text>
                        </div>
                        {summaryLoading ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Spin size="small" />
                            <Typography.Text style={{ fontSize: 13, color: "#595959" }}>
                              {t("qr.aiSummaryLoading")}
                            </Typography.Text>
                          </div>
                        ) : (
                          <Typography.Paragraph style={{ margin: 0, fontSize: 13, color: "#262626", whiteSpace: "pre-wrap" }}>
                            {aiSummary}
                          </Typography.Paragraph>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="qr-manual-section">
            <Typography.Text style={{ fontSize: 13, color: "#8C8C8C" }}>
              {t("qr.manualLabel")}
            </Typography.Text>
            <Space.Compact style={{ width: "100%", marginTop: 8 }}>
              <Input
                placeholder="BNK-IT-2026-0001"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onPressEnter={handleManualSearch}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleManualSearch}>
                {t("common.search")}
              </Button>
            </Space.Compact>
          </div>
        </div>

        {/* Namuna QR kodlar */}
        <div style={{ marginTop: 20 }}>
          <Typography.Text strong style={{ fontSize: 13, color: "#141414" }}>
            <ScanOutlined style={{ marginRight: 6, color: "#0958D9" }} />
            {t("qr.sampleTitle")}
          </Typography.Text>
          <div style={{ color: "#8C8C8C", fontSize: 12, marginTop: 4, marginBottom: 12 }}>
            {t("qr.sampleHint")}
          </div>

          {samplesLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
          ) : (
            <Row gutter={[10, 10]}>
              {sampleAssets.map((asset) => (
                <Col xs={8} sm={8} md={8} key={asset.id}>
                  <div
                    className="qr-sample-card"
                    onClick={() => handleSampleClick(asset)}
                    style={{ padding: 10 }}
                  >
                    <img
                      src={`${API_BASE}/api/assets/${asset.id}/qrcode`}
                      alt={asset.inventory_number}
                      style={{ width: 72, height: 72, borderRadius: 6 }}
                    />
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 11, color: "#141414", lineHeight: 1.2 }}>
                        {asset.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#0958D9", fontFamily: "monospace", marginTop: 1 }}>
                        {asset.inventory_number}
                      </div>
                      <Tag
                        color={STATUS_CONFIG[asset.status]?.color || "default"}
                        style={{ fontSize: 9, marginTop: 3, padding: "0 5px", lineHeight: "16px" }}
                      >
                        {STATUS_CONFIG[asset.status]?.label || asset.status}
                      </Tag>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}
