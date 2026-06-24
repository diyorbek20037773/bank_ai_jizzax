import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Typography, message, Tooltip } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { getCategories, createCategory, updateCategory } from "../api";
import type { Category } from "../types";
import { useT } from "../i18n/I18nProvider";

export default function Categories() {
  const { t } = useT();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await getCategories();
      setCategories(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await updateCategory(editing.id, values);
        message.success(t("directory.categories.updated"));
      } else {
        await createCategory(values);
        message.success(t("directory.categories.created"));
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
        <Typography.Title level={4}>{t("directory.categories.title")}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModal(true); }}>
          {t("directory.categories.new")}
        </Button>
      </div>

      <Table
        dataSource={categories}
        rowKey="id"
        loading={loading}
        size="middle"
        columns={[
          { title: t("directory.categories.cols.code"), dataIndex: "code", width: 80 },
          { title: t("directory.categories.cols.name"), dataIndex: "name" },
          { title: t("directory.categories.cols.description"), dataIndex: "description", ellipsis: true },
          { title: t("directory.categories.cols.usefulLifeMonths"), dataIndex: "useful_life_months", width: 140 },
          {
            title: "", width: 60,
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
        open={modal}
        onOk={() => form.submit()}
        onCancel={() => { setModal(false); setEditing(null); }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t("directory.categories.fields.name")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t("directory.categories.fields.code")} rules={[{ required: true }]}>
            <Input placeholder="IT" />
          </Form.Item>
          <Form.Item name="description" label={t("directory.categories.fields.description")}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="useful_life_months" label={t("directory.categories.fields.usefulLifeMonths")}>
            <InputNumber min={1} style={{ width: "100%" }} placeholder="60" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
