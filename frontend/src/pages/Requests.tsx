import { useEffect, useState } from "react";
import {
  Card, Table, Tag, Button, Modal, Input, message, Spin, Empty, Badge, Typography, Space,
} from "antd";
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SendOutlined, EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAllRequests, respondToRequest } from "../api";
import { STATUS_CONFIG, API_BASE } from "../utils/constants";
import dayjs from "dayjs";

interface RequestItem {
  id: number;
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

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  STATUS_CHANGE: { label: "Status o'zgartirish", color: "blue" },
  REPORT_LOST: { label: "Yo'qolgan", color: "red" },
  REPORT_DAMAGE: { label: "Shikastlangan", color: "orange" },
  OTHER: { label: "Boshqa", color: "default" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Kutilmoqda", color: "orange", icon: <ClockCircleOutlined /> },
  APPROVED: { label: "Tasdiqlangan", color: "green", icon: <CheckCircleOutlined /> },
  REJECTED: { label: "Rad etilgan", color: "red", icon: <CloseCircleOutlined /> },
};

export default function Requests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<RequestItem | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    getAllRequests()
      .then(({ data }) => setRequests(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (action: "APPROVED" | "REJECTED") => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      await respondToRequest(actionModal.id, {
        status: action,
        admin_response: adminResponse.trim() || undefined,
      });
      message.success(action === "APPROVED" ? "So'rov tasdiqlandi" : "So'rov rad etildi");
      setActionModal(null);
      setAdminResponse("");
      fetchRequests();
    } catch {
      message.error("Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="animate-in">
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SendOutlined style={{ color: "#722ED1" }} />
            <span>Xodimlar so'rovlari</span>
            {pendingCount > 0 && (
              <Badge count={pendingCount} style={{ marginLeft: 4 }} />
            )}
          </div>
        }
        className="chart-card"
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
        ) : requests.length === 0 ? (
          <Empty description="Hali so'rov yo'q" />
        ) : (
          <Table
            dataSource={requests}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 15 }}
            columns={[
              {
                title: "Xodim",
                dataIndex: "user_name",
                key: "user",
                width: 130,
                render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
              },
              {
                title: "Turi",
                dataIndex: "request_type",
                key: "type",
                width: 140,
                render: (t: string) => {
                  const cfg = TYPE_LABELS[t] || TYPE_LABELS.OTHER;
                  return <Tag color={cfg.color} style={{ borderRadius: 6 }}>{cfg.label}</Tag>;
                },
              },
              {
                title: "Aktiv",
                key: "asset",
                width: 180,
                render: (_: unknown, r: RequestItem) => r.asset_name ? (
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12.5 }}>{r.asset_name}</div>
                    <div style={{ fontSize: 11, color: "#0958D9" }}>{r.asset_inventory_number}</div>
                  </div>
                ) : "—",
              },
              {
                title: "Sabab",
                dataIndex: "reason",
                key: "reason",
                ellipsis: true,
                render: (v: string) => (
                  <Typography.Text ellipsis style={{ maxWidth: 200, fontSize: 12.5 }}>{v}</Typography.Text>
                ),
              },
              {
                title: "Holat",
                dataIndex: "status",
                key: "status",
                width: 130,
                render: (s: string) => {
                  const cfg = STATUS_LABELS[s] || STATUS_LABELS.PENDING;
                  return <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 6 }}>{cfg.label}</Tag>;
                },
                filters: [
                  { text: "Kutilmoqda", value: "PENDING" },
                  { text: "Tasdiqlangan", value: "APPROVED" },
                  { text: "Rad etilgan", value: "REJECTED" },
                ],
                onFilter: (v, r) => r.status === v,
                defaultFilteredValue: ["PENDING"],
              },
              {
                title: "Sana",
                dataIndex: "created_at",
                key: "date",
                width: 120,
                render: (v: string) => dayjs(v).format("DD.MM.YYYY HH:mm"),
                sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
                defaultSortOrder: "descend",
              },
              {
                title: "",
                key: "actions",
                width: 100,
                render: (_: unknown, r: RequestItem) => (
                  <Space>
                    {r.asset_id && (
                      <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/assets/${r.asset_id}`)} />
                    )}
                    {r.status === "PENDING" && (
                      <Button size="small" type="primary" onClick={() => setActionModal(r)}
                        style={{ borderRadius: 6, background: "#722ED1" }}>
                        Ko'rish
                      </Button>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* Action Modal */}
      <Modal
        title="So'rovni ko'rib chiqish"
        open={!!actionModal}
        onCancel={() => { setActionModal(null); setAdminResponse(""); }}
        footer={actionModal?.status === "PENDING" ? [
          <Button key="reject" danger icon={<CloseCircleOutlined />} loading={submitting}
            onClick={() => handleAction("REJECTED")}>
            Rad etish
          </Button>,
          <Button key="approve" type="primary" icon={<CheckCircleOutlined />} loading={submitting}
            onClick={() => handleAction("APPROVED")}
            style={{ background: "#52C41A", borderColor: "#52C41A" }}>
            Tasdiqlash
          </Button>,
        ] : null}
      >
        {actionModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid #F0F0F0" }}>
              <div style={{ fontSize: 12, color: "#8C8C8C", marginBottom: 4 }}>Xodim</div>
              <div style={{ fontWeight: 600 }}>{actionModal.user_name}</div>
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid #F0F0F0" }}>
              <div style={{ fontSize: 12, color: "#8C8C8C", marginBottom: 4 }}>So'rov turi</div>
              <Tag color={TYPE_LABELS[actionModal.request_type]?.color} style={{ borderRadius: 6 }}>
                {TYPE_LABELS[actionModal.request_type]?.label || actionModal.request_type}
              </Tag>
            </div>
            {actionModal.asset_name && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid #F0F0F0" }}>
                <div style={{ fontSize: 12, color: "#8C8C8C", marginBottom: 4 }}>Aktiv</div>
                <div style={{ fontWeight: 500 }}>
                  {actionModal.asset_name}{" "}
                  <span style={{ color: "#0958D9", fontSize: 12 }}>({actionModal.asset_inventory_number})</span>
                </div>
              </div>
            )}
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FFF7E6", border: "1px solid #FFE58F" }}>
              <div style={{ fontSize: 12, color: "#8C8C8C", marginBottom: 4 }}>Sabab</div>
              <div style={{ fontSize: 13.5 }}>{actionModal.reason}</div>
            </div>
            {actionModal.photo_path && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid #F0F0F0" }}>
                <div style={{ fontSize: 12, color: "#8C8C8C", marginBottom: 8 }}>Qo'shimcha rasm</div>
                <img
                  src={`${API_BASE}${actionModal.photo_path}`}
                  alt="So'rov rasmi"
                  style={{ maxWidth: "100%", borderRadius: 8 }}
                />
              </div>
            )}
            {actionModal.status === "PENDING" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "block" }}>
                  Javob (ixtiyoriy)
                </label>
                <Input.TextArea
                  placeholder="Xodimga javob yozing..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
