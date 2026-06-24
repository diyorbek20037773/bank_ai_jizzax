import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Typography, message, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getDepartments, getBranches, createDepartment, updateDepartment, deleteDepartment } from "../api";
import type { Department, Branch } from "../types";
import { useT } from "../i18n/I18nProvider";

export default function Departments() {
  const { t } = useT();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [d, b] = await Promise.all([getDepartments(), getBranches()]);
      setDepartments(d.data);
      setBranches(b.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await updateDepartment(editing.id, values);
        message.success(t("directory.departments.updated"));
      } else {
        await createDepartment(values);
        message.success(t("directory.departments.created"));
      }
      setModal(false);
      form.resetFields();
      setEditing(null);
      fetch();
    } catch (e: any) {
      message.error(e.response?.data?.detail || t("common.error"));
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <Typography.Title level={4}>{t("directory.departments.title")}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModal(true); }}>
          {t("directory.departments.new")}
        </Button>
      </div>

      <Table
        dataSource={departments}
        rowKey="id"
        loading={loading}
        size="middle"
        columns={[
          { title: t("directory.departments.cols.code"), dataIndex: "code", width: 120 },
          { title: t("directory.departments.cols.name"), dataIndex: "name" },
          { title: t("directory.departments.cols.branch"), dataIndex: ["branch", "name"], width: 180 },
          {
            title: "", width: 90,
            render: (_: unknown, r: Department) => (
              <div style={{ display: "flex", gap: 4 }}>
                <Tooltip title={t("common.edit")}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModal(true); }} />
                </Tooltip>
                <Tooltip title={t("common.delete")}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={async () => { await deleteDepartment(r.id); message.success(t("directory.deleted")); fetch(); }} />
                </Tooltip>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? t("directory.departments.edit") : t("directory.departments.new")}
        open={modal}
        onOk={() => form.submit()}
        onCancel={() => { setModal(false); setEditing(null); }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t("directory.departments.fields.name")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t("directory.departments.fields.code")} rules={[{ required: true }]}>
            <Input placeholder="HQ-IT" />
          </Form.Item>
          <Form.Item name="branch_id" label={t("directory.departments.fields.branch")} rules={[{ required: true }]}>
            <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
