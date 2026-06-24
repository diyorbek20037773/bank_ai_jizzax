import { useEffect, useState } from "react";
import {
  Card, Table, Tag, Button, Modal, Input, Space, Badge, Empty,
  Spin, message, Typography, Tooltip, Row, Col, Image,
} from "antd";
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, EyeOutlined, SendOutlined,
  InboxOutlined, FilterOutlined,
} from "@ant-design/icons";
import { getAllRequests, respondToRequest } from "../api";
import { API_BASE } from "../utils/constants";
import { useT } from "../i18n/I18nProvider";
import dayjs from "dayjs";

interface RequestItem {
  id: number;
  user_id: number;
  user_name: string | null;
  asset_id: number | null;
  asset_name: string | null;
  asset_inventory_number: string | null;
  request_type: string;
  requested_status: string | null;
  reason: string;
  photo_path: string | null;
  status: string;
  admin_response: string | null;
  responder_name: string | null;
  responded_at: string | null;
  created_at: string;
}

const REQUEST_TYPE_CONFIG: Record<string, { color: string }> = {
  STATUS_CHANGE: { color: "blue" },
  REPORT_LOST: { color: "red" },
  REPORT_DAMAGE: { color: "orange" },
  OTHER: { color: "default" },
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: "warning", icon: <ClockCircleOutlined /> },
  APPROVED: { color: "success", icon: <CheckCircleOutlined /> },
  REJECTED: { color: "error", icon: <CloseCircleOutlined /> },
};

export default function AdminRequests() {
  const { t } = useT();
  const typeLabel = (k: string) => t(`requests.types.${REQUEST_TYPE_CONFIG[k] ? k : "OTHER"}`);
  const statusLabel = (k: string) => t(`requests.statuses.${STATUS_CONFIG[k] ? k : "PENDING"}`);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  // Action modal
  const [actionModal, setActionModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [adminResponse, setAdminResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detail modal
  const [detailModal, setDetailModal] = useState(false);
  const [detailReq, setDetailReq] = useState<RequestItem | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    getAllRequests()
      .then(({ data }) => setRequests(data))
      .catch(() => message.error(t("requests.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const filtered = filter === "ALL" ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  const openAction = (req: RequestItem, type: "APPROVED" | "REJECTED") => {
    setSelectedReq(req);
    setActionType(type);
    setAdminResponse("");
    setActionModal(true);
  };

  const handleAction = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await respondToRequest(selectedReq.id, {
        status: actionType,
        admin_response: adminResponse.trim() || undefined,
      });
      message.success(actionType === "APPROVED" ? t("requests.approvedMsgExcl") : t("requests.rejectedMsg"));
      setActionModal(false);
      fetchRequests();
    } catch {
      message.error(t("requests.actionError"));
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (req: RequestItem) => {
    setDetailReq(req);
    setDetailModal(true);
  };

  const columns = [
    {
      title: t("requests.colEmployee"),
      key: "user",
      width: 150,
      render: (_: unknown, r: RequestItem) => (
        <Typography.Text strong style={{ fontSize: 13 }}>{r.user_name || "—"}</Typography.Text>
      ),
    },
    {
      title: t("requests.colAsset"),
      key: "asset",
      width: 220,
      render: (_: unknown, r: RequestItem) => r.asset_name ? (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.asset_name}</div>
          <div style={{ fontSize: 11, color: "#8c8c8c" }}>{r.asset_inventory_number}</div>
        </div>
      ) : <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("requests.unassigned")}</Typography.Text>,
    },
    {
      title: t("requests.colType"),
      dataIndex: "request_type",
      key: "type",
      width: 160,
      render: (v: string) => {
        const cfg = REQUEST_TYPE_CONFIG[v] || { color: "default" };
        return <Tag color={cfg.color} style={{ borderRadius: 6, fontSize: 11 }}>{REQUEST_TYPE_CONFIG[v] ? typeLabel(v) : v}</Tag>;
      },
    },
    {
      title: t("requests.colReason"),
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <Typography.Text style={{ fontSize: 12.5 }}>{v}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: t("requests.colStatus"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (v: string) => {
        const cfg = STATUS_CONFIG[v] || STATUS_CONFIG.PENDING;
        return <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 6 }}>{statusLabel(v)}</Tag>;
      },
    },
    {
      title: t("requests.colDate"),
      dataIndex: "created_at",
      key: "date",
      width: 130,
      render: (v: string) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(v).format("DD.MM.YYYY HH:mm")}
        </Typography.Text>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 200,
      render: (_: unknown, r: RequestItem) => (
        <Space size={4}>
          <Tooltip title={t("requests.viewDetail")}>
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
          </Tooltip>
          {r.status === "PENDING" && (
            <>
              <Button
                size="small" type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => openAction(r, "APPROVED")}
                style={{ borderRadius: 6, background: "#52C41A", borderColor: "#52C41A" }}
              >
                {t("requests.approve")}
              </Button>
              <Button
                size="small" danger
                icon={<CloseCircleOutlined />}
                onClick={() => openAction(r, "REJECTED")}
                style={{ borderRadius: 6 }}
              >
                {t("requests.reject")}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-in">
      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={8} sm={6}>
          <div className="stat-card" onClick={() => setFilter("ALL")} style={{ cursor: "pointer", border: filter === "ALL" ? "2px solid #0958D9" : undefined }}>
            <div className="stat-icon blue"><InboxOutlined /></div>
            <div className="stat-value">{requests.length}</div>
            <div className="stat-label">{t("requests.statTotal")}</div>
          </div>
        </Col>
        <Col xs={8} sm={6}>
          <div className="stat-card" onClick={() => setFilter("PENDING")} style={{ cursor: "pointer", border: filter === "PENDING" ? "2px solid #FA8C16" : undefined }}>
            <div className="stat-icon orange"><ClockCircleOutlined /></div>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">{t("requests.statPending")}</div>
          </div>
        </Col>
        <Col xs={8} sm={6}>
          <div className="stat-card" onClick={() => setFilter("APPROVED")} style={{ cursor: "pointer", border: filter === "APPROVED" ? "2px solid #52C41A" : undefined }}>
            <div className="stat-icon green"><CheckCircleOutlined /></div>
            <div className="stat-value">{requests.filter(r => r.status === "APPROVED").length}</div>
            <div className="stat-label">{t("requests.statApproved")}</div>
          </div>
        </Col>
        <Col xs={8} sm={6}>
          <div className="stat-card" onClick={() => setFilter("REJECTED")} style={{ cursor: "pointer", border: filter === "REJECTED" ? "2px solid #FF4D4F" : undefined }}>
            <div className="stat-icon" style={{ background: "linear-gradient(135deg, #FF4D4F, #CF1322)" }}><CloseCircleOutlined style={{ color: "#fff" }} /></div>
            <div className="stat-value">{requests.filter(r => r.status === "REJECTED").length}</div>
            <div className="stat-label">{t("requests.statRejected")}</div>
          </div>
        </Col>
      </Row>

      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SendOutlined style={{ color: "#722ED1" }} />
            <span>{t("requests.headerAdmin")}</span>
            <Badge count={pendingCount} style={{ marginLeft: 4 }} />
            {filter !== "ALL" && (
              <Tag
                closable
                onClose={() => setFilter("ALL")}
                color="purple"
                style={{ marginLeft: 8, borderRadius: 6 }}
                icon={<FilterOutlined />}
              >
                {filter === "PENDING" ? t("requests.statuses.PENDING") : filter === "APPROVED" ? t("requests.statuses.APPROVED") : t("requests.statuses.REJECTED")}
              </Tag>
            )}
          </div>
        }
        className="chart-card"
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty description={t("requests.emptyAdmin")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowClassName={(r) => r.status === "PENDING" ? "pending-row" : ""}
          />
        )}
      </Card>

      {/* Action modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {actionType === "APPROVED"
              ? <CheckCircleOutlined style={{ color: "#52C41A", fontSize: 18 }} />
              : <CloseCircleOutlined style={{ color: "#FF4D4F", fontSize: 18 }} />
            }
            <span>{actionType === "APPROVED" ? t("requests.approveTitle") : t("requests.rejectTitle")}</span>
          </div>
        }
        open={actionModal}
        onOk={handleAction}
        onCancel={() => setActionModal(false)}
        okText={actionType === "APPROVED" ? t("requests.approve") : t("requests.reject")}
        okButtonProps={{
          loading: submitting,
          danger: actionType === "REJECTED",
          style: actionType === "APPROVED" ? { background: "#52C41A", borderColor: "#52C41A" } : {},
        }}
        cancelText={t("common.cancel")}
      >
        {selectedReq && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid #F0F0F0" }}>
              <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 4 }}>{t("requests.employeeRequest")}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedReq.user_name}</div>
              {selectedReq.asset_name && (
                <div style={{ fontSize: 12, color: "#0958D9" }}>
                  {selectedReq.asset_name} ({selectedReq.asset_inventory_number})
                </div>
              )}
              <div style={{ fontSize: 12.5, marginTop: 6, color: "#434343" }}>{selectedReq.reason}</div>
            </div>

            {actionType === "APPROVED" && selectedReq.request_type === "REPORT_LOST" && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: "#FFF2F0", border: "1px solid #FFCCC7",
                fontSize: 12.5, color: "#CF1322",
              }}>
                <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                {t("requests.lostWarning")}
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "block", color: "#434343" }}>
                {t("requests.responseOptionalYour")}
              </label>
              <Input.TextArea
                placeholder={t("requests.responsePlaceholderYour")}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Detail modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EyeOutlined style={{ color: "#0958D9" }} />
            <span>{t("requests.detailTitle")}</span>
          </div>
        }
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={detailReq?.status === "PENDING" ? [
          <Button key="reject" danger icon={<CloseCircleOutlined />} onClick={() => { setDetailModal(false); openAction(detailReq!, "REJECTED"); }}>
            {t("requests.reject")}
          </Button>,
          <Button key="approve" type="primary" icon={<CheckCircleOutlined />}
            style={{ background: "#52C41A", borderColor: "#52C41A" }}
            onClick={() => { setDetailModal(false); openAction(detailReq!, "APPROVED"); }}>
            {t("requests.approve")}
          </Button>,
        ] : null}
        width={520}
      >
        {detailReq && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ fontSize: 11, color: "#8c8c8c" }}>{t("requests.colEmployee")}</div>
                <div style={{ fontWeight: 600 }}>{detailReq.user_name}</div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 11, color: "#8c8c8c" }}>{t("requests.colDate")}</div>
                <div style={{ fontWeight: 500 }}>{dayjs(detailReq.created_at).format("DD.MM.YYYY HH:mm")}</div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ fontSize: 11, color: "#8c8c8c" }}>{t("requests.requestType")}</div>
                <Tag color={REQUEST_TYPE_CONFIG[detailReq.request_type]?.color} style={{ borderRadius: 6, marginTop: 4 }}>
                  {REQUEST_TYPE_CONFIG[detailReq.request_type] ? typeLabel(detailReq.request_type) : detailReq.request_type}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 11, color: "#8c8c8c" }}>{t("requests.colStatus")}</div>
                <Tag icon={STATUS_CONFIG[detailReq.status]?.icon} color={STATUS_CONFIG[detailReq.status]?.color}
                  style={{ borderRadius: 6, marginTop: 4 }}>
                  {statusLabel(detailReq.status)}
                </Tag>
              </Col>
            </Row>

            {detailReq.asset_name && (
              <div>
                <div style={{ fontSize: 11, color: "#8c8c8c" }}>{t("requests.colAsset")}</div>
                <div style={{ fontWeight: 600, color: "#0958D9" }}>
                  {detailReq.asset_name} <span style={{ fontWeight: 400, color: "#8c8c8c" }}>({detailReq.asset_inventory_number})</span>
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 4 }}>{t("requests.reasonComment")}</div>
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid #F0F0F0", fontSize: 13 }}>
                {detailReq.reason}
              </div>
            </div>

            {detailReq.photo_path && (
              <div>
                <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 4 }}>{t("requests.attachedPhoto")}</div>
                <Image
                  src={`${API_BASE}${detailReq.photo_path}`}
                  style={{ borderRadius: 10, maxHeight: 200 }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
                />
              </div>
            )}

            {detailReq.admin_response && (
              <div>
                <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 4 }}>{t("requests.adminResponse")}</div>
                <div style={{
                  padding: "12px 16px", borderRadius: 10, fontSize: 13,
                  background: detailReq.status === "APPROVED" ? "#F6FFED" : "#FFF2F0",
                  border: `1px solid ${detailReq.status === "APPROVED" ? "#B7EB8F" : "#FFCCC7"}`,
                }}>
                  <strong>{detailReq.responder_name || t("requests.defaultResponder")}:</strong> {detailReq.admin_response}
                  <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 4 }}>
                    {detailReq.responded_at && dayjs(detailReq.responded_at).format("DD.MM.YYYY HH:mm")}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
