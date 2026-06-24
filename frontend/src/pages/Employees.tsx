import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Typography, message, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getEmployees, getDepartments, createEmployee, updateEmployee, deleteEmployee } from "../api";
import type { Employee, Department } from "../types";
import { useT } from "../i18n/I18nProvider";

export default function Employees() {
  const { t } = useT();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
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

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await updateEmployee(editing.id, values);
        message.success(t("directory.employees.updated"));
      } else {
        await createEmployee(values);
        message.success(t("directory.employees.created"));
      }
      setModal(false);
      form.resetFields();
      setEditing(null);
      fetch();
    } catch (e: any) {
      message.error(e.response?.data?.detail || t("common.error"));
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    form.setFieldsValue(emp);
    setModal(true);
  };

  const handleDelete = async (id: number) => {
    await deleteEmployee(id);
    message.success(t("directory.deleted"));
    fetch();
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <Typography.Title level={4}>{t("directory.employees.title")}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModal(true); }}>
          {t("directory.employees.new")}
        </Button>
      </div>

      <Table
        dataSource={employees}
        rowKey="id"
        loading={loading}
        size="middle"
        columns={[
          { title: t("directory.employees.cols.code"), dataIndex: "employee_code", width: 100 },
          { title: t("directory.employees.cols.fullName"), dataIndex: "full_name" },
          { title: t("directory.employees.cols.position"), dataIndex: "position" },
          { title: t("directory.employees.cols.department"), dataIndex: ["department", "name"], width: 160 },
          { title: t("directory.employees.cols.phone"), dataIndex: "phone", width: 140 },
          {
            title: "", width: 90,
            render: (_: unknown, r: Employee) => (
              <div style={{ display: "flex", gap: 4 }}>
                <Tooltip title={t("common.edit")}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
                </Tooltip>
                <Tooltip title={t("common.delete")}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
                </Tooltip>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? t("directory.employees.edit") : t("directory.employees.new")}
        open={modal}
        onOk={() => form.submit()}
        onCancel={() => { setModal(false); setEditing(null); }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="full_name" label={t("directory.employees.fields.fullName")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="employee_code" label={t("directory.employees.fields.employeeCode")} rules={[{ required: true }]}>
            <Input placeholder="EMP-001" />
          </Form.Item>
          <Form.Item name="position" label={t("directory.employees.fields.position")}>
            <Input />
          </Form.Item>
          <Form.Item name="department_id" label={t("directory.employees.fields.department")} rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
            />
          </Form.Item>
          <Form.Item name="phone" label={t("directory.employees.fields.phone")}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t("directory.employees.fields.email")}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
