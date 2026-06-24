import { useEffect, useState, useMemo } from "react";
import {
  Tabs, Table, Button, Modal, Form, Input, InputNumber, Select,
  message, Tooltip, Tag, Badge, Popconfirm, Space,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  TeamOutlined, ApartmentOutlined, BankOutlined, AppstoreOutlined,
} from "@ant-design/icons";
import {
  getEmployees, getDepartments, getBranches, getCategories,
  createEmployee, updateEmployee, deleteEmployee,
  createDepartment, updateDepartment, deleteDepartment,
  createBranch, updateBranch, deleteBranch,
  createCategory, updateCategory,
} from "../api";
import type { Employee, Department, Branch, Category } from "../types";
import { useT } from "../i18n/I18nProvider";

// ─── Xodimlar Tab ───
function EmployeesTab() {
  const { t } = useT();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [e, d] = await Promise.all([getEmployees(), getDepartments()]);
      setEmployees(e.data);
      setDepartments(d.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    let list = employees;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.employee_code?.toLowerCase().includes(q) ||
        e.position?.toLowerCase().includes(q) ||
        e.phone?.toLowerCase().includes(q)
      );
    }
    if (deptFilter) {
      list = list.filter((e) => e.department_id === deptFilter);
    }
    return list;
  }, [employees, search, deptFilter]);

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await updateEmployee(editing.id, values);
        message.success(t("directory.employees.updated"));
      } else {
        await createEmployee(values);
        message.success(t("directory.employees.created"));
      }
      setModal(false); form.resetFields(); setEditing(null); fetch();
    } catch (e: any) { message.error(e.response?.data?.detail || t("common.error")); }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Input
          placeholder={t("directory.employees.searchPlaceholder")}
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Select
          placeholder={t("directory.employees.deptFilter")}
          allowClear
          value={deptFilter}
          onChange={(v) => setDeptFilter(v)}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
          style={{ minWidth: 180 }}
        />
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModal(true); }}>
          {t("directory.employees.new")}
        </Button>
      </div>
      <Table
        dataSource={filtered} rowKey="id" loading={loading} size="middle"
        scroll={{ x: 700 }}
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => t("directory.total", { n: total }) }}
        columns={[
          { title: t("directory.employees.cols.code"), dataIndex: "employee_code", width: 100 },
          { title: t("directory.employees.cols.fullName"), dataIndex: "full_name", ellipsis: true },
          { title: t("directory.employees.cols.position"), dataIndex: "position", ellipsis: true },
          { title: t("directory.employees.cols.department"), dataIndex: ["department", "name"], width: 160, ellipsis: true },
          { title: t("directory.employees.cols.phone"), dataIndex: "phone", width: 140 },
          {
            title: "", width: 80, fixed: "right" as const,
            render: (_: unknown, r: Employee) => (
              <Space size={0}>
                <Tooltip title={t("common.edit")}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue({ ...r, department_id: r.department_id }); setModal(true); }} />
                </Tooltip>
                <Popconfirm title={t("directory.employees.confirmDelete")} onConfirm={async () => { await deleteEmployee(r.id); message.success(t("directory.deleted")); fetch(); }} okText={t("common.yes")} cancelText={t("common.no")}>
                  <Tooltip title={t("common.delete")}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? t("directory.employees.edit") : t("directory.employees.new")}
        open={modal} onOk={() => form.submit()}
        onCancel={() => { setModal(false); setEditing(null); }}
        okText={t("common.save")} cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="full_name" label={t("directory.employees.fields.fullName")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="employee_code" label={t("directory.employees.fields.employeeCode")} rules={[{ required: true }]}><Input placeholder="EMP-001" /></Form.Item>
          <Form.Item name="position" label={t("directory.employees.fields.position")}><Input /></Form.Item>
          <Form.Item name="department_id" label={t("directory.employees.fields.department")} rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))} />
          </Form.Item>
          <Form.Item name="phone" label={t("directory.employees.fields.phone")}><Input /></Form.Item>
          <Form.Item name="email" label={t("directory.employees.fields.email")}><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Bo'limlar Tab ───
function DepartmentsTab() {
  const { t } = useT();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [d, b] = await Promise.all([getDepartments(), getBranches()]);
      setDepartments(d.data); setBranches(b.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    let list = departments;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
    }
    if (branchFilter) {
      list = list.filter((d) => d.branch_id === branchFilter);
    }
    return list;
  }, [departments, search, branchFilter]);

  const handleSubmit = async (values: any) => {
    try {
      if (editing) { await updateDepartment(editing.id, values); message.success(t("directory.departments.updated")); }
      else { await createDepartment(values); message.success(t("directory.departments.created")); }
      setModal(false); form.resetFields(); setEditing(null); fetch();
    } catch (e: any) { message.error(e.response?.data?.detail || t("common.error")); }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Input
          placeholder={t("directory.departments.searchPlaceholder")}
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 260, flex: 1 }}
        />
        <Select
          placeholder={t("directory.departments.branchFilter")}
          allowClear
          value={branchFilter}
          onChange={(v) => setBranchFilter(v)}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          style={{ minWidth: 180 }}
        />
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModal(true); }}>
          {t("directory.departments.new")}
        </Button>
      </div>
      <Table
        dataSource={filtered} rowKey="id" loading={loading} size="middle"
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => t("directory.total", { n: total }) }}
        columns={[
          { title: t("directory.departments.cols.code"), dataIndex: "code", width: 120 },
          { title: t("directory.departments.cols.name"), dataIndex: "name" },
          { title: t("directory.departments.cols.branch"), dataIndex: ["branch", "name"], width: 180 },
          {
            title: "", width: 80,
            render: (_: unknown, r: Department) => (
              <Space size={0}>
                <Tooltip title={t("common.edit")}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue({ ...r, branch_id: r.branch_id }); setModal(true); }} />
                </Tooltip>
                <Popconfirm title={t("directory.departments.confirmDelete")} onConfirm={async () => { await deleteDepartment(r.id); message.success(t("directory.deleted")); fetch(); }} okText={t("common.yes")} cancelText={t("common.no")}>
                  <Tooltip title={t("common.delete")}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? t("directory.departments.edit") : t("directory.departments.new")}
        open={modal} onOk={() => form.submit()}
        onCancel={() => { setModal(false); setEditing(null); }}
        okText={t("common.save")} cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t("directory.departments.fields.name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label={t("directory.departments.fields.code")} rules={[{ required: true }]}><Input placeholder="HQ-IT" /></Form.Item>
          <Form.Item name="branch_id" label={t("directory.departments.fields.branch")} rules={[{ required: true }]}>
            <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Filiallar Tab ───
function BranchesTab() {
  const { t } = useT();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await getBranches(); setBranches(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    if (!search) return branches;
    const q = search.toLowerCase();
    return branches.filter((b) =>
      b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.address?.toLowerCase().includes(q)
    );
  }, [branches, search]);

  const handleSubmit = async (values: any) => {
    try {
      if (editing) { await updateBranch(editing.id, values); message.success(t("directory.branches.updated")); }
      else { await createBranch(values); message.success(t("directory.branches.created")); }
      setModal(false); form.resetFields(); setEditing(null); fetch();
    } catch (e: any) { message.error(e.response?.data?.detail || t("common.error")); }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Input
          placeholder={t("directory.branches.searchPlaceholder")}
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 300, flex: 1 }}
        />
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModal(true); }}>
          {t("directory.branches.new")}
        </Button>
      </div>
      <Table
        dataSource={filtered} rowKey="id" loading={loading} size="middle"
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => t("directory.total", { n: total }) }}
        columns={[
          { title: t("directory.branches.cols.code"), dataIndex: "code", width: 100 },
          { title: t("directory.branches.cols.name"), dataIndex: "name" },
          { title: t("directory.branches.cols.address"), dataIndex: "address", ellipsis: true },
          {
            title: "", width: 80,
            render: (_: unknown, r: Branch) => (
              <Space size={0}>
                <Tooltip title={t("common.edit")}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModal(true); }} />
                </Tooltip>
                <Popconfirm title={t("directory.branches.confirmDelete")} onConfirm={async () => { await deleteBranch(r.id); message.success(t("directory.deleted")); fetch(); }} okText={t("common.yes")} cancelText={t("common.no")}>
                  <Tooltip title={t("common.delete")}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? t("directory.branches.edit") : t("directory.branches.new")}
        open={modal} onOk={() => form.submit()}
        onCancel={() => { setModal(false); setEditing(null); }}
        okText={t("common.save")} cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t("directory.branches.fields.name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label={t("directory.branches.fields.code")} rules={[{ required: true }]}><Input placeholder="BR-01" /></Form.Item>
          <Form.Item name="address" label={t("directory.branches.fields.address")}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Kategoriyalar Tab ───
function CategoriesTab() {
  const { t } = useT();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await getCategories(); setCategories(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const handleSubmit = async (values: any) => {
    try {
      if (editing) { await updateCategory(editing.id, values); message.success(t("directory.categories.updated")); }
      else { await createCategory(values); message.success(t("directory.categories.created")); }
      setModal(false); form.resetFields(); setEditing(null); fetch();
    } catch (e: any) { message.error(e.response?.data?.detail || t("common.error")); }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Input
          placeholder={t("directory.categories.searchPlaceholder")}
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 300, flex: 1 }}
        />
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModal(true); }}>
          {t("directory.categories.new")}
        </Button>
      </div>
      <Table
        dataSource={filtered} rowKey="id" loading={loading} size="middle"
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => t("directory.total", { n: total }) }}
        columns={[
          { title: t("directory.categories.cols.code"), dataIndex: "code", width: 80 },
          { title: t("directory.categories.cols.name"), dataIndex: "name" },
          { title: t("directory.categories.cols.description"), dataIndex: "description", ellipsis: true },
          {
            title: t("directory.categories.cols.usefulLife"), dataIndex: "useful_life_months", width: 140,
            render: (m: number) => m ? <Tag>{Math.floor(m / 12)} {t("directory.categories.year")} {m % 12 > 0 ? `${m % 12} ${t("directory.categories.month")}` : ""}</Tag> : "—",
          },
          {
            title: "", width: 50,
            render: (_: unknown, r: Category) => (
              <Tooltip title={t("common.edit")}>
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModal(true); }} />
              </Tooltip>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? t("directory.categories.edit") : t("directory.categories.new")}
        open={modal} onOk={() => form.submit()}
        onCancel={() => { setModal(false); setEditing(null); }}
        okText={t("common.save")} cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t("directory.categories.fields.name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label={t("directory.categories.fields.code")} rules={[{ required: true }]}><Input placeholder="IT" /></Form.Item>
          <Form.Item name="description" label={t("directory.categories.fields.description")}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="useful_life_months" label={t("directory.categories.fields.usefulLifeMonths")}>
            <InputNumber min={1} style={{ width: "100%" }} placeholder="60" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── MAIN: Directory Page ───
export default function Directory() {
  const { t } = useT();
  const [counts, setCounts] = useState({ employees: 0, departments: 0, branches: 0, categories: 0 });

  useEffect(() => {
    Promise.all([getEmployees(), getDepartments(), getBranches(), getCategories()])
      .then(([e, d, b, c]) => {
        setCounts({
          employees: e.data.length,
          departments: d.data.length,
          branches: b.data.length,
          categories: c.data.length,
        });
      });
  }, []);

  const tabItems = [
    {
      key: "employees",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TeamOutlined /> {t("directory.tabs.employees")}
          <Badge count={counts.employees} style={{ backgroundColor: "#0958D9" }} overflowCount={999} />
        </span>
      ),
      children: <EmployeesTab />,
    },
    {
      key: "departments",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ApartmentOutlined /> {t("directory.tabs.departments")}
          <Badge count={counts.departments} style={{ backgroundColor: "#0958D9" }} overflowCount={999} />
        </span>
      ),
      children: <DepartmentsTab />,
    },
    {
      key: "branches",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BankOutlined /> {t("directory.tabs.branches")}
          <Badge count={counts.branches} style={{ backgroundColor: "#0958D9" }} overflowCount={999} />
        </span>
      ),
      children: <BranchesTab />,
    },
    {
      key: "categories",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AppstoreOutlined /> {t("directory.tabs.categories")}
          <Badge count={counts.categories} style={{ backgroundColor: "#0958D9" }} overflowCount={999} />
        </span>
      ),
      children: <CategoriesTab />,
    },
  ];

  return (
    <div className="animate-in">
      <div style={{ background: "#fff", borderRadius: 14, padding: "4px 24px 28px", border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)" }}>
        <Tabs items={tabItems} size="large" />
      </div>
    </div>
  );
}
