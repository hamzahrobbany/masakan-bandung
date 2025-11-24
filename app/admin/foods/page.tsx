"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import FoodForm, {
  CategoryOption,
  FoodFormData,
} from "@/app/admin/foods/components/FoodForm";
import AdminProtected from "@/components/AdminProtected";
import { readAdminToken } from "@/lib/admin-token";
import { ADMIN_TOKEN_HEADER } from "@/lib/security";
import { formatCurrency } from "@/lib/utils";

const { Title, Text } = Typography;

type Food = FoodFormData & { id: string; category?: CategoryOption | null };

export default function AdminFoodsPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>();
  const [actionLoading, setActionLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const requireAdminToken = useCallback(() => {
    const token = readAdminToken();
    if (!token) {
      throw new Error("Token admin tidak ditemukan. Muat ulang halaman admin.");
    }
    return token;
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const token = requireAdminToken();
      const res = await fetch("/api/admin/categories", {
        headers: {
          [ADMIN_TOKEN_HEADER]: token,
        },
      });
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : "Gagal memuat kategori";
      setError(messageText);
      messageApi.error(messageText);
    }
  }, [messageApi, requireAdminToken]);

  const loadFoods = useCallback(async () => {
    setTableLoading(true);
    try {
      const token = requireAdminToken();
      const res = await fetch("/api/admin/foods", {
        headers: {
          [ADMIN_TOKEN_HEADER]: token,
        },
      });
      if (!res.ok) throw new Error("Gagal memuat makanan");
      const data = await res.json();
      setFoods(data);
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : "Gagal memuat makanan";
      setError(messageText);
      messageApi.error(messageText);
    } finally {
      setTableLoading(false);
    }
  }, [messageApi, requireAdminToken]);

  useEffect(() => {
    void Promise.all([loadCategories(), loadFoods()]);
  }, [loadCategories, loadFoods]);

  const filteredFoods = useMemo(() => {
    if (!filterCategory) return foods;
    return foods.filter((food) => food.categoryId === filterCategory);
  }, [filterCategory, foods]);

  const handleDelete = useCallback(
    async (id: string) => {
      setActionLoading(true);
      try {
        const token = requireAdminToken();
        const res = await fetch(`/api/admin/foods/${id}`, {
          method: "DELETE",
          headers: {
            [ADMIN_TOKEN_HEADER]: token,
          },
        });
        if (!res.ok) {
          throw new Error("Gagal hapus makanan");
        }
        setEditingFood(null);
        await loadFoods();
        messageApi.success("Makanan berhasil dihapus");
      } catch (err) {
        const messageText =
          err instanceof Error ? err.message : "Gagal hapus makanan";
        messageApi.error(messageText);
      } finally {
        setActionLoading(false);
      }
    },
    [loadFoods, messageApi, requireAdminToken]
  );

  const toggleAvailability = useCallback(
    async (food: Food) => {
      setActionLoading(true);
      try {
        const token = requireAdminToken();
        const res = await fetch(`/api/admin/foods/${food.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            [ADMIN_TOKEN_HEADER]: token,
          },
          body: JSON.stringify({
            isAvailable: !food.isAvailable,
          }),
        });
        if (!res.ok) {
          throw new Error("Gagal memperbarui status");
        }
        await loadFoods();
        messageApi.success("Status makanan diperbarui");
      } catch (err) {
        const messageText =
          err instanceof Error ? err.message : "Gagal memperbarui status";
        messageApi.error(messageText);
      } finally {
        setActionLoading(false);
      }
    },
    [loadFoods, messageApi, requireAdminToken]
  );

  const openCreateModal = useCallback(() => {
    setEditingFood(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((food: Food) => {
    setEditingFood(food);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setEditingFood(null);
    setIsModalOpen(false);
  }, []);

  const confirmDelete = useCallback(
    (food: Food) => {
      Modal.confirm({
        title: `Hapus ${food.name}?`,
        content: "Tindakan ini tidak dapat dibatalkan.",
        okText: "Hapus",
        okButtonProps: { danger: true },
        cancelText: "Batal",
        onOk: () => handleDelete(food.id),
      });
    },
    [handleDelete]
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  const columns = useMemo<ColumnsType<Food>>(
    () => [
      {
        title: "Nama",
        dataIndex: "name",
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            {record.description && (
              <Text type="secondary">{record.description}</Text>
            )}
          </Space>
        ),
      },
      {
        title: "Kategori",
        dataIndex: "categoryId",
        render: (_, record) =>
          categoryMap.get(record.categoryId) ?? record.category?.name ?? "-",
      },
      {
        title: "Rating",
        dataIndex: "rating",
        render: (value: number) => <Tag color="gold">{value.toFixed(1)}</Tag>,
      },
      {
        title: "Stok",
        dataIndex: "stock",
        render: (value: number) => (
          <Tag color={value === 0 ? "red" : value < 5 ? "orange" : "green"}>
            Stok {value}
          </Tag>
        ),
      },
      {
        title: "Harga",
        dataIndex: "price",
        align: "right",
        render: (value: number) => <Text strong>{formatCurrency(value)}</Text>,
      },
      {
        title: "Status",
        dataIndex: "isAvailable",
        render: (value: boolean) => (
          <Tag color={value ? "green" : "default"}>
            {value ? "Tersedia" : "Tidak tersedia"}
          </Tag>
        ),
      },
      {
        title: "Aksi",
        key: "actions",
        render: (_, record) => (
          <Space wrap>
            <Button size="small" onClick={() => openEditModal(record)}>
              Edit
            </Button>
            <Button
              size="small"
              onClick={() => toggleAvailability(record)}
              loading={actionLoading}
            >
              {record.isAvailable ? "Nonaktifkan" : "Aktifkan"}
            </Button>
            <Button
              size="small"
              danger
              onClick={() => confirmDelete(record)}
              disabled={actionLoading}
            >
              Hapus
            </Button>
          </Space>
        ),
      },
    ],
    [actionLoading, categoryMap, confirmDelete, openEditModal, toggleAvailability]
  );

  return (
    <AdminProtected>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%", padding: 24 }}>
        <div>
          <Text type="secondary">Admin</Text>
          <Title level={3} style={{ margin: 0 }}>
            Kelola Makanan
          </Title>
          <Text>Tambah, ubah, dan atur ketersediaan menu.</Text>
        </div>

        <Space wrap>
          <Card>
            <Text type="secondary">Total Makanan</Text>
            <Title level={4} style={{ margin: 0 }}>
              {foods.length}
            </Title>
          </Card>
          <Card>
            <Text type="secondary">Kategori</Text>
            <Title level={4} style={{ margin: 0 }}>
              {categories.length}
            </Title>
          </Card>
        </Space>

        <Space
          wrap
          align="center"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Select
            allowClear
            placeholder="Semua kategori"
            style={{ minWidth: 220 }}
            value={filterCategory}
            onChange={(value) => setFilterCategory(value || undefined)}
            options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          />
          <Button type="primary" onClick={openCreateModal}>
            Tambah Makanan
          </Button>
        </Space>

        {error && (
          <Alert
            type="error"
            message={error}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Card>
          <Table
            rowKey="id"
            dataSource={filteredFoods}
            columns={columns}
            loading={tableLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>

      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
        centered
        width={800}
        title={
          <div>
            <Text type="secondary">
              {editingFood ? "Edit" : "Tambah"} Makanan
            </Text>
            <Title level={4} style={{ margin: 0 }}>
              {editingFood ? editingFood.name : "Form Makanan"}
            </Title>
          </div>
        }
      >
        <FoodForm
          categories={categories}
          initialData={editingFood ?? undefined}
          onSuccess={async () => {
            await loadFoods();
            closeModal();
          }}
          onCancel={closeModal}
        />
      </Modal>
    </AdminProtected>
  );
}
