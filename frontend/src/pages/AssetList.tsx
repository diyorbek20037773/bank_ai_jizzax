import { useEffect, useState } from "react";
import { Table, Button, Input, Select, Tag, Row, Col, message, Tooltip, Popconfirm } from "antd";
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAssets, getCategories, getDepartments, getBranches, deleteAsset } from "../api";
import type { Asset, Category, Department, Branch } from "../types";
import { STATUS_CONFIG } from "../utils/constants";
import { useT } from "../i18n/I18nProvider";

export default function AssetList() {
  const { t } = useT();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Read initial filter from URL (e.g. ?status=ASSIGNED)
  const initialStatus = searchParams.get("status") || undefined;
  const [filters, setFilters] = useState<Record<string, unknown>>({
    ...(initialStatus ? { status: initialStatus } : {}),
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data } = await getAssets({ page, page_size: pageSize, ...filters });
      setAssets(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([getCategories(), getDepartments(), getBranches()])
      .then(([c, d, b]) => {
        setCategories(c.data);
        setDepartments(d.data);
        setBranches(b.data);
      });
  }, []);

  useEffect(() => { fetchAssets(); }, [page, pageSize, filters]);

  const handleDelete = async (id: number) => {
    try {
      await deleteAsset(id);
      message.success(t("assets.deletedSuccess"));
      fetchAssets();
    } catch (e: any) {
      message.error(e.response?.data?.detail || t("assets.deleteError"));
    }
  };

  const columns = [
    {
      title: t("assets.inventoryNumber"),
      dataIndex: "inventory_number",
      key: "inventory_number",
      width: 180,
      render: (v: string, r: Asset) => (
        <a onClick={() => navigate(`/assets/${r.id}`)} style={{ fontWeight: 600 }}>{v}</a>
      ),
    },
    { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
    {
      title: t("common.category"),
      dataIndex: ["category", "name"],
      key: "category",
      width: 140,
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (s: string) => {
        const cfg = STATUS_CONFIG[s];
        return <Tag color={cfg?.color} style={{ borderRadius: 6 }}>{cfg ? t(`common.statuses.${s}`) : s}</Tag>;
      },
    },
    {
      title: t("assets.employee"),
      dataIndex: ["current_employee", "full_name"],
      key: "employee",
      width: 160,
      render: (v: string) => v || <span style={{ color: "#bfbfbf" }}>—</span>,
    },
    {
      title: t("assets.department"),
      dataIndex: ["current_department", "name"],
      key: "department",
      width: 140,
      render: (v: string) => v || <span style={{ color: "#bfbfbf" }}>—</span>,
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Asset) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Tooltip title={t("common.view")}>
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/assets/${record.id}`)} />
          </Tooltip>
          <Tooltip title={t("common.edit")}>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/assets/${record.id}/edit`)} />
          </Tooltip>
          <Popconfirm
            title={t("assets.deleteTitle")}
            description={t("assets.deleteConfirm")}
            onConfirm={() => handleDelete(record.id)}
            okText={t("assets.deleteOk")}
            cancelText={t("common.cancel")}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title={t("assets.deleteTooltip")}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-in">
      <div className="filter-bar">
        <Row gutter={[14, 14]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder={t("assets.searchPlaceholder")}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              allowClear
              onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, search: e.target.value || undefined })); }}
            />
          </Col>
          <Col xs={12} sm={8} md={5}>
            <Select
              placeholder={t("common.category")}
              allowClear
              style={{ width: "100%" }}
              onChange={(v) => { setPage(1); setFilters((f) => ({ ...f, category_id: v })); }}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Col>
          <Col xs={12} sm={8} md={5}>
            <Select
              placeholder={t("common.status")}
              allowClear
              style={{ width: "100%" }}
              value={(filters.status as string) || undefined}
              onChange={(v) => {
                setPage(1);
                setFilters((f) => ({ ...f, status: v }));
                // Update URL to reflect filter
                if (v) {
                  setSearchParams({ status: v });
                } else {
                  setSearchParams({});
                }
              }}
              options={Object.keys(STATUS_CONFIG).map((k) => ({ value: k, label: t(`common.statuses.${k}`) }))}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder={t("assets.department")}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              onChange={(v) => { setPage(1); setFilters((f) => ({ ...f, department_id: v })); }}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder={t("assets.branch")}
              allowClear
              style={{ width: "100%" }}
              onChange={(v) => { setPage(1); setFilters((f) => ({ ...f, branch_id: v })); }}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </Col>
          <Col xs={24} sm={8} md={4} style={{ display: "flex", justifyContent: "flex-end", marginLeft: "auto" }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/assets/new")}>
              {t("assets.newAsset")}
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        dataSource={assets}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count) => t("assets.totalCount", { n: count }),
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
}
