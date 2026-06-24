import { useEffect, useState } from "react";
import {
  Card, Table, Tag, Spin, Row, Col, Empty, Button, Modal, Select,
  Input, Upload, message, Badge, Timeline, Typography,
} from "antd";
import {
  LaptopOutlined, HistoryOutlined, SendOutlined,
  ExclamationCircleOutlined, UploadOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getMyAssets, createRequest, getMyRequests, uploadPhoto } from "../api";
import type { Asset } from "../types";
import { STATUS_CONFIG } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/I18nProvider";
import dayjs from "dayjs";

interface AssignmentHistory {
  id: number;
  asset_id: number;
  asset_name: string | null;
  asset_inventory_number: string | null;
  asset_status: string | null;
  assigned_at: string | null;
  returned_at: string | null;
  return_reason: string | null;
  department_name: string | null;
}

interface UserRequestItem {
  id: number;
  asset_name: string | null;
  asset_inventory_number: string | null;
  request_type: string;
  requested_status: string | null;
  reason: string;
  photo_path: string | null;
  status: string;
  admin_response: string | null;
  created_at: string;
  responded_at: string | null;
}

const REQUEST_TYPE_LABEL_KEYS: Record<string, string> = {
  STATUS_CHANGE: "myAssets.requestTypeStatusChange",
  REPORT_LOST: "myAssets.requestTypeReportLost",
  REPORT_DAMAGE: "myAssets.requestTypeReportDamage",
  OTHER: "myAssets.requestTypeOther",
};

const REQUEST_STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; labelKey: string }> = {
  PENDING: { color: "orange", icon: <ClockCircleOutlined />, labelKey: "myAssets.requestStatusPending" },
  APPROVED: { color: "green", icon: <CheckCircleOutlined />, labelKey: "myAssets.requestStatusApproved" },
  REJECTED: { color: "red", icon: <CloseCircleOutlined />, labelKey: "myAssets.requestStatusRejected" },
};

export default function MyAssets() {
  const navigate = useNavigate();
  const { t } = useT();
  useAuth();
  const [currentAssets, setCurrentAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Request state
  const [requestModal, setRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<string>("");
  const [selectedAsset, setSelectedAsset] = useState<number | undefined>();
  const [reason, setReason] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<UserRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      getMyAssets().then(({ data }) => {
        setCurrentAssets(data.current_assets);
        setHistory(data.history);
      }),
      fetchRequests(),
    ]).finally(() => setLoading(false));
  };

  const fetchRequests = () => {
    setRequestsLoading(true);
    return getMyRequests()
      .then(({ data }) => setMyRequests(data))
      .finally(() => setRequestsLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data } = await uploadPhoto(file);
      setPhotoPath(data.path);
      message.success(t("myAssets.photoUploadSuccess"));
    } catch {
      message.error(t("myAssets.photoUploadError"));
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSubmitRequest = async () => {
    if (!requestType || !reason.trim()) {
      message.warning(t("myAssets.requestValidation"));
      return;
    }
    setSubmitting(true);
    try {
      await createRequest({
        asset_id: selectedAsset,
        request_type: requestType,
        requested_status: requestType === "REPORT_LOST" ? "LOST" : undefined,
        reason: reason.trim(),
        photo_path: photoPath || undefined,
      });
      message.success(t("myAssets.requestSuccess"));
      setRequestModal(false);
      resetForm();
      fetchRequests();
    } catch {
      message.error(t("myAssets.requestError"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRequestType("");
    setSelectedAsset(undefined);
    setReason("");
    setPhotoPath(null);
  };

  const needsPhoto = requestType === "REPORT_DAMAGE";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: 400, gap: 16 }}>
        <Spin size="large" />
        <span style={{ fontSize: 13, color: "#8C8C8C", fontWeight: 450 }}>{t("myAssets.loadingAssets")}</span>
      </div>
    );
  }

  return (
    <div className="animate-in">

      {/* Stat cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-icon blue"><LaptopOutlined /></div>
            <div className="stat-value">{currentAssets.length}</div>
            <div className="stat-label">{t("myAssets.statCurrent")}</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-icon green"><HistoryOutlined /></div>
            <div className="stat-value">{history.length}</div>
            <div className="stat-label">{t("myAssets.statHistory")}</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-icon orange"><ClockCircleOutlined /></div>
            <div className="stat-value">{myRequests.filter(r => r.status === "PENDING").length}</div>
            <div className="stat-label">{t("myAssets.statPending")}</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setRequestModal(true)}>
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, #722ED1, #531DAB)" }}><PlusOutlined style={{ color: "#fff" }} /></div>
            <div className="stat-value" style={{ fontSize: 14, color: "#722ED1" }}>{t("myAssets.statNew")}</div>
            <div className="stat-label">{t("myAssets.statNewRequest")}</div>
          </div>
        </Col>
      </Row>

      {/* Hozirgi aktivlar */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LaptopOutlined style={{ color: "#0958D9" }} />
            <span>{t("myAssets.currentSectionTitle")}</span>
            <Tag color="blue">{t("myAssets.currentCount", { n: currentAssets.length })}</Tag>
          </div>
        }
        className="chart-card"
        style={{ marginBottom: 16 }}
      >
        {currentAssets.length === 0 ? (
          <Empty description={t("myAssets.currentEmpty")} />
        ) : (
          <Table
            dataSource={currentAssets}
            rowKey="id"
            size="small"
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate(`/assets/${record.id}`),
              style: { cursor: "pointer" },
            })}
            columns={[
              {
                title: t("myAssets.colInventory"),
                dataIndex: "inventory_number",
                key: "inv",
                render: (v: string) => <span style={{ fontWeight: 600, color: "#0958D9" }}>{v}</span>,
              },
              { title: t("common.name"), dataIndex: "name", key: "name" },
              {
                title: t("common.category"),
                dataIndex: ["category", "name"],
                key: "cat",
              },
              {
                title: t("common.status"),
                dataIndex: "status",
                key: "status",
                render: (s: string) => (
                  <Tag color={STATUS_CONFIG[s]?.color} style={{ borderRadius: 6 }}>
                    {STATUS_CONFIG[s] ? t(`common.statuses.${s}`) : s}
                  </Tag>
                ),
              },
              {
                title: t("common.price"),
                dataIndex: "purchase_price",
                key: "price",
                render: (v: number) => v ? t("myAssets.priceFormat", { value: Number(v).toLocaleString("ru-RU") }) : "—",
              },
            ]}
          />
        )}
      </Card>

      {/* So'rovlar tarixi */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SendOutlined style={{ color: "#722ED1" }} />
            <span>{t("myAssets.requestsSectionTitle")}</span>
            <Badge count={myRequests.filter(r => r.status === "PENDING").length} style={{ marginLeft: 4 }} />
          </div>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setRequestModal(true)}
            style={{ borderRadius: 6, background: "linear-gradient(135deg, #722ED1, #531DAB)" }}>
            {t("myAssets.newRequestBtn")}
          </Button>
        }
        className="chart-card"
        style={{ marginBottom: 16 }}
      >
        {requestsLoading ? (
          <Spin size="small" />
        ) : myRequests.length === 0 ? (
          <Empty description={t("myAssets.requestsEmpty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Timeline
            items={myRequests.slice(0, 10).map((req) => {
              const cfg = REQUEST_STATUS_CONFIG[req.status] || REQUEST_STATUS_CONFIG.PENDING;
              return {
                color: cfg.color,
                children: (
                  <div style={{ padding: "4px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <Tag color={cfg.color} icon={cfg.icon} style={{ borderRadius: 6, fontSize: 11, margin: 0 }}>
                        {t(cfg.labelKey)}
                      </Tag>
                      <Tag style={{ borderRadius: 6, fontSize: 11, margin: 0 }}>
                        {REQUEST_TYPE_LABEL_KEYS[req.request_type] ? t(REQUEST_TYPE_LABEL_KEYS[req.request_type]) : req.request_type}
                      </Tag>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(req.created_at).format("DD.MM.YYYY HH:mm")}
                      </Typography.Text>
                    </div>
                    {req.asset_name && (
                      <div style={{ fontSize: 12, color: "#0958D9", fontWeight: 500, marginBottom: 2 }}>
                        {req.asset_name} ({req.asset_inventory_number})
                      </div>
                    )}
                    <div style={{ fontSize: 12.5, color: "#434343" }}>{req.reason}</div>
                    {req.admin_response && (
                      <div style={{
                        marginTop: 6, padding: "8px 12px", borderRadius: 8,
                        background: req.status === "APPROVED" ? "#F6FFED" : "#FFF2F0",
                        border: `1px solid ${req.status === "APPROVED" ? "#B7EB8F" : "#FFCCC7"}`,
                        fontSize: 12,
                      }}>
                        <strong>{t("myAssets.adminResponse")}</strong> {req.admin_response}
                      </div>
                    )}
                  </div>
                ),
              };
            })}
          />
        )}
      </Card>

      {/* Tarix */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HistoryOutlined style={{ color: "#722ED1" }} />
            <span>{t("myAssets.historySectionTitle")}</span>
          </div>
        }
        className="chart-card"
      >
        {history.length === 0 ? (
          <Empty description={t("myAssets.historyEmpty")} />
        ) : (
          <Table
            dataSource={history}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: t("myAssets.colAsset"),
                key: "asset",
                render: (_: unknown, r: AssignmentHistory) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.asset_name}</div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>{r.asset_inventory_number}</div>
                  </div>
                ),
              },
              {
                title: t("common.status"),
                dataIndex: "asset_status",
                key: "status",
                render: (s: string) => s ? (
                  <Tag color={STATUS_CONFIG[s]?.color} style={{ borderRadius: 6 }}>
                    {STATUS_CONFIG[s] ? t(`common.statuses.${s}`) : s}
                  </Tag>
                ) : "—",
              },
              {
                title: t("myAssets.colAssigned"),
                dataIndex: "assigned_at",
                key: "assigned",
                render: (v: string) => v ? dayjs(v).format("DD.MM.YYYY") : "—",
              },
              {
                title: t("myAssets.colReturned"),
                dataIndex: "returned_at",
                key: "returned",
                render: (v: string) =>
                  v ? dayjs(v).format("DD.MM.YYYY") : <Tag color="green" style={{ borderRadius: 6 }}>{t("myAssets.nowAssigned")}</Tag>,
              },
              {
                title: t("myAssets.colReturnReason"),
                dataIndex: "return_reason",
                key: "reason",
                render: (v: string) => v || "—",
              },
              {
                title: t("myAssets.colDepartment"),
                dataIndex: "department_name",
                key: "dept",
                render: (v: string) => v || "—",
              },
            ]}
          />
        )}
      </Card>

      {/* So'rov yuborish modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SendOutlined style={{ color: "#722ED1" }} />
            <span>{t("myAssets.modalTitle")}</span>
          </div>
        }
        open={requestModal}
        onOk={handleSubmitRequest}
        onCancel={() => { setRequestModal(false); resetForm(); }}
        okText={t("myAssets.submitBtn")}
        cancelText={t("common.cancel")}
        okButtonProps={{ loading: submitting, icon: <SendOutlined /> }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "block", color: "#434343" }}>
              {t("myAssets.fieldRequestType")}
            </label>
            <Select
              placeholder={t("myAssets.requestTypePlaceholder")}
              style={{ width: "100%" }}
              value={requestType || undefined}
              onChange={(v) => { setRequestType(v); if (v === "REPORT_LOST") setSelectedAsset(undefined); }}
              options={[
                { value: "REPORT_LOST", label: t("myAssets.requestTypeReportLost") },
                { value: "REPORT_DAMAGE", label: t("myAssets.requestTypeReportDamage") },
                { value: "STATUS_CHANGE", label: t("myAssets.requestTypeStatusChangeOption") },
                { value: "OTHER", label: t("myAssets.requestTypeOther") },
              ]}
            />
          </div>

          {currentAssets.length > 0 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "block", color: "#434343" }}>
                {requestType === "REPORT_LOST" || requestType === "REPORT_DAMAGE" ? t("myAssets.fieldAssetRequired") : t("myAssets.fieldAssetOptional")}
              </label>
              <Select
                placeholder={t("myAssets.assetPlaceholder")}
                allowClear
                style={{ width: "100%" }}
                value={selectedAsset}
                onChange={setSelectedAsset}
                options={currentAssets.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.inventory_number})`,
                }))}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "block", color: "#434343" }}>
              {t("myAssets.fieldReason")}
            </label>
            <Input.TextArea
              placeholder={
                requestType === "REPORT_LOST"
                  ? t("myAssets.reasonPlaceholderLost")
                  : requestType === "REPORT_DAMAGE"
                  ? t("myAssets.reasonPlaceholderDamage")
                  : t("myAssets.reasonPlaceholderDefault")
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              status={reason.trim() ? undefined : "error"}
            />
          </div>

          {needsPhoto && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "block", color: "#434343" }}>
                <ExclamationCircleOutlined style={{ color: "#FA8C16", marginRight: 4 }} />
                {t("myAssets.fieldDamagePhoto")}
              </label>
              <Upload
                beforeUpload={(file) => { handleUpload(file); return false; }}
                maxCount={1}
                accept="image/*"
                showUploadList={photoPath ? true : false}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {photoPath ? t("myAssets.uploadAnotherPhoto") : t("myAssets.uploadPhoto")}
                </Button>
              </Upload>
              {photoPath && (
                <Tag color="green" style={{ marginTop: 6, borderRadius: 6 }}>
                  <CheckCircleOutlined /> {t("myAssets.photoUploaded")}
                </Tag>
              )}
            </div>
          )}

          {requestType === "REPORT_LOST" && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "#FFF2F0", border: "1px solid #FFCCC7",
              fontSize: 12.5, color: "#CF1322",
            }}>
              <ExclamationCircleOutlined style={{ marginRight: 6 }} />
              {t("myAssets.lostNotice")}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
