"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import AdminProtected from "@/components/AdminProtected";
import { readAdminToken } from "@/lib/admin-token";
import { ADMIN_TOKEN_HEADER } from "@/lib/security";

type Category = {
  id: string;
  name: string;
  createdAt: string;
};

const { Title, Text } = Typography;

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const requireAdminToken = useCallback(() => {
    const token = readAdminToken();
    if (!token) {
      throw new Error("Token admin tidak ditemukan. Muat ulang halaman admin.");
    }
    return token;
  }, []);

  const loadCategories = useCallback(async () => {
    setTableLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const res = await fetch("/api/admin/categories", {
        headers: {
          [ADMIN_TOKEN_HEADER]: token,
        },
      });
      if (!res.ok) {
        throw new Error("Gagal memuat kategori");
      }
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : "Gagal memuat kategori";
      setError(messageText);
      messageApi.error(messageText);
    } finally {
      setTableLoading(false);
    }
  }, [messageApi, requireAdminToken]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleCreate = useCallback(
    async (values: { name: string }) => {
      setActionLoading(true);
      try {
        const token = requireAdminToken();
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [ADMIN_TOKEN_HEADER]: token,
          },
          body: JSON.stringify({ name: values.name }),
        });
        if (!res.ok) {
          throw new Error("Gagal membuat kategori");
        }
        form.resetFields();
        await loadCategories();
        messageApi.success("Kategori berhasil ditambahkan");
      } catch (err) {
        const messageText =
          err instanceof Error ? err.message : "Gagal membuat kategori";
        messageApi.error(messageText);
      } finally {
        setActionLoading(false);
      }
    },
    [form, loadCategories, messageApi, requireAdminToken]
  );

  const handleUpdate = useCallback(
    async (id: string) => {
      if (!editingName.trim()) return;
      setActionLoading(true);
      try {
        const token = requireAdminToken();
        const res = await fetch(`/api/admin/categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            [ADMIN_TOKEN_HEADER]: token,
          },
          body: JSON.stringify({ name: editingName }),
        });

        if (!res.ok) {
          throw new Error("Gagal memperbarui kategori");
        }
        setEditingId(null);
        setEditingName("");
        await loadCategories();
        messageApi.success("Kategori diperbarui");
      } catch (err) {
        const messageText =
          err instanceof Error ? err.message : "Gagal memperbarui kategori";
        messageApi.error(messageText);
      } finally {
        setActionLoading(false);
      }
    },
    [editingName, loadCategories, messageApi, requireAdminToken]
  );

  const handleDelete = useCallback(
    (id: string, name: string) => {
      Modal.confirm({
        title: `Hapus ${name}?`,
        content: "Tindakan ini tidak dapat dibatalkan.",
        okText: "Hapus",
        okButtonProps: { danger: true },
        cancelText: "Batal",
        onOk: async () => {
          setActionLoading(true);
          try {
            const token = requireAdminToken();
            const res = await fetch(`/api/admin/categories/${id}`, {
              method: "DELETE",
              headers: {
                [ADMIN_TOKEN_HEADER]: token,
              },
            });
            if (!res.ok) {
              throw new Error("Gagal menghapus kategori");
            }
            await loadCategories();
            messageApi.success("Kategori berhasil dihapus");
          } catch (err) {
            const messageText =
              err instanceof Error ? err.message : "Gagal menghapus kategori";
            messageApi.error(messageText);
          } finally {
            setActionLoading(false);
          }
        },
      });
    },
    [loadCategories, messageApi, requireAdminToken]
  );

  const columns = useMemo<ColumnsType<Category>>(
    () => [
      {
        title: "Nama",
        dataIndex: "name",
        render: (_, record) =>
          editingId === record.id ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              maxLength={120}
            />
          ) : (
            <Text>{record.name}</Text>
          ),
      },
      {
        title: "Dibuat",
        dataIndex: "createdAt",
        render: (value: string) =>
          new Date(value).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      },
      {
        title: "Aksi",
        key: "actions",
        width: 200,
        render: (_, record) =>
          editingId === record.id ? (
            <Space>
              <Button
                size="small"
                type="primary"
                onClick={() => handleUpdate(record.id)}
                loading={actionLoading}
              >
                Simpan
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditingId(null);
                  setEditingName("");
                }}
                disabled={actionLoading}
              >
                Batal
              </Button>
            </Space>
          ) : (
            <Space>
              <Button
                size="small"
                onClick={() => {
                  setEditingId(record.id);
                  setEditingName(record.name);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                onClick={() => handleDelete(record.id, record.name)}
              >
                Hapus
              </Button>
            </Space>
          ),
      },
    ],
    [actionLoading, editingId, editingName, handleDelete, handleUpdate]
  );

  return (
    <AdminProtected>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%", padding: 24 }}>
        <div>
          <Text type="secondary">Admin</Text>
          <Title level={3} style={{ margin: 0 }}>
            Kelola Kategori
          </Title>
          <Text>Tambah dan kelola kategori makanan.</Text>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Card>
          <Form
            layout="inline"
            form={form}
            onFinish={handleCreate}
            style={{ gap: 16 }}
          >
            <Form.Item
              name="name"
              rules={[
                { required: true, message: "Nama kategori wajib diisi" },
                { max: 120, message: "Nama maksimal 120 karakter" },
              ]}
            >
              <Input placeholder="Nama kategori baru" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={actionLoading}
              >
                Tambah
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card>
          <Table
            rowKey="id"
            dataSource={categories}
            columns={columns}
            loading={tableLoading}
            pagination={false}
          />
        </Card>
      </Space>
    </AdminProtected>
  );
}
