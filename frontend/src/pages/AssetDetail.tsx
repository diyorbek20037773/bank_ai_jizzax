import { useEffect, useState } from "react";
import {
  Tag, Button, Card, Row, Col, Image, Timeline, Table,
  Modal, Select, Input, Typography, Spin, message, Popconfirm, Space,
} from "antd";
import {
  EditOutlined, ArrowLeftOutlined,
  SwapOutlined, RollbackOutlined, DownloadOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAsset, getAssetAssignments, getAssetAuditLogs,
  changeAssetStatus, assignAsset, returnAsset, getAssetQRCode, getEmployees,
} from "../api";
import type { Asset, Assignment, AuditLog, Employee } from "../types";
import { STATUS_CONFIG, ALLOWED_TRANSITIONS, API_BASE } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/I18nProvider";
import dayjs from "dayjs";

const ACTION_COLORS: Record<string, string> = {
  CREATED: "green",
  UPDATED: "blue",
  STATUS_CHANGED: "orange",
  ASSIGNED: "cyan",
  RETURNED: "purple",
  DELETED: "red",
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useT();
  const { user } = useAuth();
  const isUser = user?.role === "user";
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const [assignModal, setAssignModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [assignNotes, setAssignNotes] = useState("");

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [a, asgn, logs] = await Promise.all([
        getAsset(+id),
        getAssetAssignments(+id),
        getAssetAuditLogs(+id),
      ]);
      setAsset(a.data);
      setAssignments(asgn.data);
      setAuditLogs(logs.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async () => {
    if (!asset || !newStatus) return;
    if (!statusReason.trim()) {
      message.warning(t("assetDetail.reasonRequired"));
      return;
    }
    try {
      await changeAssetStatus(asset.id, newStatus, statusReason);
      message.success(t("assetDetail.statusChanged"));
      setStatusModal(false);
      setNewStatus("");
      setStatusReason("");
      fetchData();
    } catch (e: any) {
      message.error(e.response?.data?.detail || t("common.error"));
    }
  };

  const handleAssign = async () => {
    if (!asset || !selectedEmployee) return;
    try {
      await assignAsset({ asset_id: asset.id, employee_id: selectedEmployee, notes: assignNotes });
      message.success(t("assetDetail.assetAssigned"));
      setAssignModal(false);
      setSelectedEmployee(null);
      setAssignNotes("");
      fetchData();
    } catch (e: any) {
      message.error(e.response?.data?.detail || t("common.error"));
    }
  };

  const handleReturn = async (assignmentId: number) => {
    try {
      await returnAsset(assignmentId);
      message.success(t("assetDetail.assetReturned"));
      fetchData();
    } catch (e: any) {
      message.error(e.response?.data?.detail || t("common.error"));
    }
  };

  const openAssignModal = async () => {
    const { data } = await getEmployees();
    setEmployees(data);
    setAssignModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: 400, gap: 16 }}>
        <Spin size="large" />
        <span style={{ fontSize: 13, color: "#8C8C8C", fontWeight: 450 }}>{t("assetDetail.loadingAsset")}</span>
      </div>
    );
  }
  if (!asset) return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <div style={{ fontSize: 48, color: "#D9D9D9", marginBottom: 16 }}>!</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#141414", marginBottom: 8 }}>{t("assetDetail.notFound")}</div>
      <div style={{ fontSize: 13, color: "#8C8C8C" }}>{t("assetDetail.notFoundDesc")}</div>
    </div>
  );

  const allowedStatuses = ALLOWED_TRANSITIONS[asset.status] || [];
  const activeAssignment = assignments.find((a) => !a.returned_at);
  const qrUrl = getAssetQRCode(asset.id);

  return (
    <div className="animate-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/assets")} />
          <Typography.Title level={4} style={{ margin: 0 }}>{asset.name}</Typography.Title>
          <Tag
            color={STATUS_CONFIG[asset.status]?.color}
            style={{ fontSize: 13, padding: "3px 14px", borderRadius: 6, fontWeight: 600, letterSpacing: "0.02em" }}
          >
            {t(`common.statuses.${asset.status}`)}
          </Tag>
        </div>
        {!isUser && (
          <div className="detail-actions">
            <Button icon={<EditOutlined />} onClick={() => navigate(`/assets/${asset.id}/edit`)}>
              {t("common.edit")}
            </Button>
            {allowedStatuses.length > 0 && (
              <Button icon={<SwapOutlined />} onClick={() => setStatusModal(true)}>
                {t("assetDetail.changeStatus")}
              </Button>
            )}
            {asset.status !== "ASSIGNED" && allowedStatuses.includes("ASSIGNED") && (
              <Button type="primary" icon={<UserAddOutlined />} onClick={openAssignModal}>
                {t("assetDetail.assign")}
              </Button>
            )}
            {activeAssignment && (
              <Popconfirm title={t("assetDetail.returnConfirm")} onConfirm={() => handleReturn(activeAssignment.id)}>
                <Button icon={<RollbackOutlined />} danger>{t("assetDetail.return")}</Button>
              </Popconfirm>
            )}
          </div>
        )}
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={17}>
          <Card className="detail-main-card" title={t("assetDetail.assetInfo")}>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">{t("assetDetail.inventoryNumber")}</div>
                <div className="info-value">
                  <Typography.Text copyable strong>{asset.inventory_number}</Typography.Text>
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.serialNumber")}</div>
                <div className="info-value">{asset.serial_number || "—"}</div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("common.category")}</div>
                <div className="info-value">
                  <Tag color="blue" style={{ borderRadius: 6 }}>{asset.category?.name}</Tag>
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.condition")}</div>
                <div className="info-value">
                  <Tag color={STATUS_CONFIG[asset.status]?.color} style={{ borderRadius: 6 }}>{t(`common.statuses.${asset.status}`)}</Tag>
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.purchaseDate")}</div>
                <div className="info-value">{asset.purchase_date ? dayjs(asset.purchase_date).format("DD.MM.YYYY") : "—"}</div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.purchasePrice")}</div>
                <div className="info-value" style={{ fontWeight: 600 }}>
                  {asset.purchase_price ? `${Number(asset.purchase_price).toLocaleString("ru-RU")} ${t("common.currency")}` : "—"}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.currentValue")}</div>
                <div className="info-value" style={{ fontWeight: 600, color: "#0958D9" }}>
                  {asset.current_value != null ? `${Number(asset.current_value).toLocaleString("ru-RU")} ${t("common.currency")}` : "—"}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.warrantyExpiry")}</div>
                <div className="info-value" style={{
                  fontWeight: 500,
                  color: asset.warranty_expiry
                    ? (dayjs(asset.warranty_expiry).isBefore(dayjs()) ? "#ff4d4f" : "#52c41a")
                    : undefined,
                }}>
                  {asset.warranty_expiry ? dayjs(asset.warranty_expiry).format("DD.MM.YYYY") : "—"}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.responsibleEmployee")}</div>
                <div className="info-value">
                  {asset.current_employee?.full_name || <span style={{ color: "#bfbfbf" }}>{t("assetDetail.notAssigned")}</span>}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.department")}</div>
                <div className="info-value">{asset.current_department?.name || <span style={{ color: "#bfbfbf" }}>—</span>}</div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.branch")}</div>
                <div className="info-value">{asset.current_branch?.name || <span style={{ color: "#bfbfbf" }}>—</span>}</div>
              </div>
              <div className="info-item">
                <div className="info-label">{t("assetDetail.registeredAt")}</div>
                <div className="info-value">{dayjs(asset.created_at).format("DD.MM.YYYY HH:mm")}</div>
              </div>
              {asset.notes && (
                <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                  <div className="info-label">{t("assetDetail.notes")}</div>
                  <div className="info-value" style={{ fontWeight: 400 }}>{asset.notes}</div>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={7}>
          <Card title={t("assetDetail.qrCode")} size="small">
            <div className="qr-display-card">
              <Image src={qrUrl} width={160} preview={false} style={{ borderRadius: 8 }} />
              <div style={{ marginTop: 10 }}>
                <Typography.Text copyable={{ text: asset.inventory_number }} style={{ fontSize: 13, fontWeight: 600 }}>
                  {asset.inventory_number}
                </Typography.Text>
              </div>
              <Space style={{ marginTop: 10 }}>
                <a href={qrUrl} download={`${asset.inventory_number}.png`}>
                  <Button icon={<DownloadOutlined />} size="small">{t("assetDetail.download")}</Button>
                </a>
              </Space>
            </div>
          </Card>
          {asset.photo_path && (
            <Card title={t("assetDetail.photo")} size="small" style={{ marginTop: 16 }}>
              <Image
                src={`${API_BASE}${asset.photo_path}`}
                width="100%"
                style={{ borderRadius: 8 }}
              />
            </Card>
          )}
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card className="chart-card" title={t("assetDetail.assignmentHistory")} size="small">
            <Table
              dataSource={assignments}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: t("assetDetail.employee"), dataIndex: ["employee", "full_name"], width: 140 },
                { title: t("assetDetail.department"), dataIndex: ["department", "name"], width: 120 },
                {
                  title: t("assetDetail.assignedAt"), dataIndex: "assigned_at", width: 100,
                  render: (v: string) => dayjs(v).format("DD.MM.YYYY"),
                },
                {
                  title: t("assetDetail.returnedAt"), dataIndex: "returned_at", width: 110,
                  render: (v: string) => v
                    ? dayjs(v).format("DD.MM.YYYY")
                    : <Tag color="green" style={{ borderRadius: 6 }}>{t("assetDetail.currentlyHeld")}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="chart-card" title={t("assetDetail.auditHistory")} size="small">
            <div style={{ maxHeight: 400, overflow: "auto", padding: "8px 0" }}>
              <Timeline
                items={auditLogs.slice(0, 20).map((log) => ({
                  color: ACTION_COLORS[log.action] || "gray",
                  children: (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                        <Tag
                          color={ACTION_COLORS[log.action] || "default"}
                          style={{ fontSize: 11, borderRadius: 4, margin: 0 }}
                        >
                          {log.action}
                        </Tag>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(log.performed_at).format("DD.MM.YYYY HH:mm")}
                        </Typography.Text>
                        {log.user && (
                          <Typography.Text style={{ fontSize: 12, color: "#0958D9" }}>
                            — {log.user.full_name}
                          </Typography.Text>
                        )}
                      </div>
                      <Typography.Text style={{ fontSize: 13 }}>{log.description}</Typography.Text>
                    </div>
                  ),
                }))}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={t("assetDetail.changeStatus")}
        open={statusModal}
        onOk={handleStatusChange}
        onCancel={() => setStatusModal(false)}
        okText={t("assetDetail.changeAction")}
        cancelText={t("common.cancel")}
      >
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#FAFBFC", border: "1px solid #F0F0F0" }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("assetDetail.currentStatus")}</Typography.Text>{" "}
          <Tag color={STATUS_CONFIG[asset.status]?.color} style={{ borderRadius: 6, fontWeight: 600 }}>{t(`common.statuses.${asset.status}`)}</Tag>
        </div>
        <Select
          placeholder={t("assetDetail.selectNewStatus")}
          style={{ width: "100%", marginBottom: 14 }}
          value={newStatus || undefined}
          onChange={setNewStatus}
          options={allowedStatuses.map((s) => ({
            value: s, label: t(`common.statuses.${s}`) || s,
          }))}
        />
        <Input.TextArea
          placeholder={t("assetDetail.reasonPlaceholder")}
          value={statusReason}
          onChange={(e) => setStatusReason(e.target.value)}
          rows={3}
          status={!statusReason.trim() ? "error" : undefined}
        />
      </Modal>

      <Modal
        title={t("assetDetail.assignToEmployee")}
        open={assignModal}
        onOk={handleAssign}
        onCancel={() => setAssignModal(false)}
        okText={t("assetDetail.assign")}
        cancelText={t("common.cancel")}
      >
        <Select
          placeholder={t("assetDetail.selectEmployee")}
          showSearch
          optionFilterProp="label"
          style={{ width: "100%", marginBottom: 12 }}
          value={selectedEmployee}
          onChange={setSelectedEmployee}
          options={employees.map((e) => ({
            value: e.id, label: `${e.full_name} (${e.employee_code}) - ${e.department?.name || ""}`,
          }))}
        />
        <Input.TextArea
          placeholder={t("assetDetail.notesOptional")}
          value={assignNotes}
          onChange={(e) => setAssignNotes(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  );
}
