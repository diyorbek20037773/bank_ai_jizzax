import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Typography, message, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api";
import type { Branch } from "../types";
import { useT } from "../i18n/I18nProvider";

export default function Branches() {
  const { t } = useT();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await getBranches();
      setBranches(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await updateBranch(editing.id, values);
        message.success(t("directory.branches.updated"));
      } else {
        await createBranch(values);
        message.success(t("directory.branches.created"));
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
        <Typography.Title level={4}>{t("directory.branches.title")}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModal(true); }}>
          {t("directory.branches.new")}
        </Button>
      </div>

      <Table
        dataSource={branches}
        rowKey="id"
        loading={loading}
        size="middle"
        columns={[
          { title: t("directory.branches.cols.code"), dataIndex: "code", width: 100 },
          { title: t("directory.branches.cols.name"), dataIndex: "name" },
          { title: t("directory.branches.cols.address"), dataIndex: "address", ellipsis: true },
          {
            title: "", width: 90,
            render: (_: unknown, r: Branch) => (
              <div style={{ display: "flex", gap: 4 }}>
                <Tooltip title={t("common.edit")}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModal(true); }} />
                </Tooltip>
                <Tooltip title={t("common.delete")}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={async () => { await deleteBranch(r.id); message.success(t("directory.deleted")); fetch(); }} />
                </Tooltip>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? t("directory.branches.edit") : t("directory.branches.new")}
        open={modal}
        onOk={() => form.submit()}
        onCancel={() => { setModal(false); setEditing(null); }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t("directory.branches.fields.name")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t("directory.branches.fields.code")} rules={[{ required: true }]}>
            <Input placeholder="BR-01" />
          </Form.Item>
          <Form.Item name="address" label={t("directory.branches.fields.address")}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
