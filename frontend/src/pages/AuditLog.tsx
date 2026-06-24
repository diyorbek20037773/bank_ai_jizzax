import { useEffect, useState } from "react";
import { Table, Tag, Select } from "antd";
import { getAuditLogs, getUsers } from "../api";
import type { AuditLog, User } from "../types";
import dayjs from "dayjs";
import { useT } from "../i18n/I18nProvider";

const ACTION_COLORS: Record<string, string> = {
  CREATED: "green",
  UPDATED: "blue",
  STATUS_CHANGED: "orange",
  ASSIGNED: "cyan",
  RETURNED: "purple",
  DELETED: "red",
};

export default function AuditLogPage() {
  const { t } = useT();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [userFilter, setUserFilter] = useState<number | undefined>();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getUsers().then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await getAuditLogs({ page, page_size: 20, action: actionFilter, performed_by: userFilter });
      setLogs(data.items);
      setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter, userFilter]);

  return (
    <div className="animate-in">
      <div className="filter-bar" style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <Select
          placeholder={t("audit.actionFilter")}
          allowClear
          style={{ width: 180 }}
          onChange={(v) => { setPage(1); setActionFilter(v); }}
          options={[
            { value: "CREATED", label: t("audit.actions.CREATED") },
            { value: "UPDATED", label: t("audit.actions.UPDATED") },
            { value: "STATUS_CHANGED", label: t("audit.actions.STATUS_CHANGED") },
            { value: "ASSIGNED", label: t("audit.actions.ASSIGNED") },
            { value: "RETURNED", label: t("audit.actions.RETURNED") },
            { value: "DELETED", label: t("audit.actions.DELETED") },
          ]}
        />
        <Select
          placeholder={t("audit.userFilter")}
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 200 }}
          onChange={(v) => { setPage(1); setUserFilter(v); }}
          options={users.map((u) => ({ value: u.id, label: u.full_name }))}
        />
      </div>

      <Table
        dataSource={logs}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{
          current: page,
          pageSize: 20,
          total,
          showTotal: (n) => t("audit.total", { n }),
          onChange: setPage,
        }}
        columns={[
          {
            title: t("audit.time"), dataIndex: "performed_at", width: 150,
            render: (v: string) => (
              <span style={{ fontSize: 13, color: "#595959" }}>
                {dayjs(v).format("DD.MM.YYYY HH:mm")}
              </span>
            ),
          },
          {
            title: t("audit.action"), dataIndex: "action", width: 140,
            render: (v: string) => (
              <Tag color={ACTION_COLORS[v] || "default"} style={{ borderRadius: 6 }}>{t(`audit.actions.${v}`)}</Tag>
            ),
          },
          { title: t("audit.description"), dataIndex: "description", ellipsis: true },
          { title: t("audit.performedBy"), dataIndex: ["user", "full_name"], width: 150 },
          {
            title: t("audit.assetId"), dataIndex: "asset_id", width: 80,
            render: (v: number) => v || <span style={{ color: "#bfbfbf" }}>—</span>,
          },
        ]}
      />
    </div>
  );
}
