"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
  Form,
  InputNumber,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

import { readAdminToken } from "@/lib/admin-token";
import { ADMIN_TOKEN_HEADER } from "@/lib/security";
import { formatCurrency } from "@/lib/utils";

type OrderStatus = "PENDING" | "PROCESSED" | "DONE" | "CANCELLED";

type OrderItem = {
  id: string;
  foodId?: string | null;
  foodName: string;
  foodPrice: number;
  quantity: number;
};

type Order = {
  id: string;
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type FoodsOption = {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
};

type ListResponse = {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
};

const STATUS_OPTIONS: { label: string; value: OrderStatus; color: string }[] = [
  { label: "PENDING", value: "PENDING", color: "gold" },
  { label: "PROCESSED", value: "PROCESSED", color: "blue" },
  { label: "DONE", value: "DONE", color: "green" },
  { label: "CANCELLED", value: "CANCELLED", color: "red" },
];

const { Title, Text } = Typography;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number }>(
    { page: 1, pageSize: 10 }
  );
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [foods, setFoods] = useState<FoodsOption[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const requireAdminToken = useCallback(() => {
    const token = readAdminToken();
    if (!token) {
      throw new Error("Token admin tidak ditemukan. Muat ulang halaman admin.");
    }
    return token;
  }, []);

  const loadFoods = useCallback(async () => {
    try {
      const token = requireAdminToken();
      const res = await fetch("/api/admin/foods", {
        headers: { [ADMIN_TOKEN_HEADER]: token },
      });
      if (!res.ok) throw new Error("Gagal memuat daftar makanan");
      const data = await res.json();
      setFoods(data);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Gagal memuat makanan";
      void messageApi.error(messageText);
    }
  }, [messageApi, requireAdminToken]);

  const loadOrders = useCallback(
    async (page = pagination.page, pageSize = pagination.pageSize, term = search) => {
      setTableLoading(true);
      try {
        const token = requireAdminToken();
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (term) params.set("search", term);

        const res = await fetch(`/api/admin/orders?${params.toString()}` , {
          headers: { [ADMIN_TOKEN_HEADER]: token },
        });

        if (!res.ok) {
          throw new Error("Gagal memuat pesanan");
        }

        const data = (await res.json()) as ListResponse;
        setOrders(data.data);
        setTotal(data.total);
        setPagination({ page: data.page, pageSize: data.pageSize });
      } catch (err) {
        const messageText = err instanceof Error ? err.message : "Gagal memuat pesanan";
        void messageApi.error(messageText);
      } finally {
        setTableLoading(false);
      }
    },
    [messageApi, pagination.page, pagination.pageSize, requireAdminToken, search]
  );

  const handleSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      setSearchInput(value);
      setSearch(trimmed);
      void loadOrders(1, pagination.pageSize, trimmed);
    },
    [loadOrders, pagination.pageSize]
  );

  useEffect(() => {
    void loadFoods();
  }, [loadFoods]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      void loadOrders(1, pagination.pageSize, searchInput.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [loadOrders, pagination.pageSize, searchInput]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadOrders(pagination.page, pagination.pageSize, search);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadOrders, pagination.page, pagination.pageSize, search]);

  const handleTableChange = (config: TablePaginationConfig) => {
    const nextPage = config.current ?? 1;
    const nextSize = config.pageSize ?? pagination.pageSize;
    setPagination({ page: nextPage, pageSize: nextSize });
    void loadOrders(nextPage, nextSize);
  };

  const updateStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      setActionLoading(true);
      try {
        const token = requireAdminToken();
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            [ADMIN_TOKEN_HEADER]: token,
          },
          body: JSON.stringify({ status }),
        });

        if (!res.ok) throw new Error("Gagal memperbarui status");
        void messageApi.success("Status diperbarui");
        void loadOrders();
      } catch (err) {
        const messageText = err instanceof Error ? err.message : "Gagal memperbarui status";
        void messageApi.error(messageText);
      } finally {
        setActionLoading(false);
      }
    },
    [loadOrders, messageApi, requireAdminToken]
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      setActionLoading(true);
      try {
        const token = requireAdminToken();
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "DELETE",
          headers: { [ADMIN_TOKEN_HEADER]: token },
        });
        if (!res.ok) throw new Error("Gagal menghapus pesanan");
        void messageApi.success("Pesanan dihapus");
        void loadOrders();
      } catch (err) {
        const messageText = err instanceof Error ? err.message : "Gagal menghapus pesanan";
        void messageApi.error(messageText);
      } finally {
        setActionLoading(false);
      }
    },
    [loadOrders, messageApi, requireAdminToken]
  );

  const foodOptions = useMemo(
    () =>
      foods
        .filter((food) => food.isAvailable)
        .map((food) => ({
          label: `${food.name} - ${formatCurrency(food.price)}`,
          value: food.id,
          disabled: food.stock <= 0,
        })),
    [foods]
  );

  const computeItemTotal = (items: { foodId: string; quantity: number }[]) => {
    return items.reduce((sum, item) => {
      const food = foods.find((f) => f.id === item.foodId);
      if (!food) return sum;
      return sum + food.price * item.quantity;
    }, 0);
  };

  const handleCreate = useCallback(async () => {
    try {
      const values = await createForm.validateFields();
      const items = (values.items ?? []).filter(
        (item: { foodId?: string; quantity?: number }) => item.foodId && item.quantity > 0
      );
      if (items.length === 0) {
        throw new Error("Minimal satu item pesanan");
      }

      const token = requireAdminToken();
      setActionLoading(true);
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_TOKEN_HEADER]: token,
        },
        body: JSON.stringify({
          customerName: values.customerName ?? null,
          customerPhone: values.customerPhone ?? null,
          note: values.note ?? null,
          status: values.status ?? "PENDING",
          items: items.map((item: { foodId: string; quantity: number }) => ({
            foodId: item.foodId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Gagal membuat pesanan");
      }

      void messageApi.success("Pesanan berhasil dibuat");
      setCreateModalOpen(false);
      createForm.resetFields();
      void loadOrders(1, pagination.pageSize);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Gagal membuat pesanan";
      void messageApi.error(messageText);
    } finally {
      setActionLoading(false);
    }
  }, [createForm, loadOrders, messageApi, pagination.pageSize, requireAdminToken]);

  const columns: ColumnsType<Order> = [
    {
      title: "Pemesan",
      dataIndex: "customerName",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-800">{record.customerName || "Tanpa nama"}</div>
          <div className="text-xs text-slate-500">{record.customerPhone || "-"}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, record) => (
        <Select
          value={record.status}
          size="small"
          style={{ width: 140 }}
          onChange={(value) => updateStatus(record.id, value)}
          options={STATUS_OPTIONS}
          disabled={actionLoading}
        />
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      render: (value: number) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: "Dibuat",
      dataIndex: "createdAt",
      render: (value: string) => new Date(value).toLocaleString("id-ID"),
    },
    {
      title: "Aksi",
      render: (_, record) => (
        <Space size="small">
          <Link href={`/admin/orders/${record.id}`} className="text-amber-700">
            Detail
          </Link>
          <Popconfirm
            title="Hapus pesanan?"
            okText="Ya"
            cancelText="Batal"
            onConfirm={() => deleteOrder(record.id)}
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" loading={actionLoading}>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {contextHolder}
      <div className="flex items-center justify-between">
        <Title level={3} className="!mb-0">
          Pesanan
        </Title>
        <Button type="primary" onClick={() => setCreateModalOpen(true)}>
          Tambah Pesanan
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Space.Compact className="max-w-xl">
              <Input
                placeholder="Cari nama, telepon, atau catatan"
                allowClear
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => handleSearch(searchInput)}
              >
                Cari
              </Button>
            </Space.Compact>
            <div className="text-sm text-slate-500">
              Total pesanan: <span className="font-semibold text-slate-700">{total}</span>
            </div>
          </div>

          <Table<Order>
            rowKey="id"
            loading={tableLoading}
            columns={columns}
            dataSource={orders}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t}`,
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div className="space-y-1">
                  {record.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.foodName} <span className="text-xs text-slate-500">x {item.quantity}</span>
                      </span>
                      <span>{formatCurrency(item.foodPrice * item.quantity)}</span>
                    </div>
                  ))}
                  {record.note ? (
                    <div className="text-xs text-slate-600">Catatan: {record.note}</div>
                  ) : null}
                </div>
              ),
            }}
            onChange={handleTableChange}
          />
        </div>
      </Card>

      <Modal
        title="Tambah Pesanan"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={actionLoading}
        okText="Simpan"
      >
        <Form form={createForm} layout="vertical" initialValues={{ status: "PENDING", items: [{}] }}>
          <Form.Item label="Nama Pelanggan" name="customerName">
            <Input placeholder="Nama (opsional)" />
          </Form.Item>
          <Form.Item label="Nomor Telepon" name="customerPhone">
            <Input placeholder="Telepon (opsional)" />
          </Form.Item>
          <Form.Item label="Catatan" name="note">
            <Input.TextArea rows={2} placeholder="Catatan pesanan" />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.key} className="flex gap-2 items-start">
                    <Form.Item
                      {...field}
                      name={[field.name, "foodId"]}
                      rules={[{ required: true, message: "Pilih menu" }]}
                      className="flex-1"
                    >
                      <Select
                        showSearch
                        placeholder="Pilih menu"
                        options={foodOptions}
                        optionFilterProp="label"
                      />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, "quantity"]}
                      rules={[{ required: true, message: "Jumlah" }]}
                    >
                      <InputNumber min={1} placeholder="Qty" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button danger type="text" onClick={() => remove(field.name)}>
                        Hapus
                      </Button>
                    )}
                    {index === fields.length - 1 && (
                      <Button type="link" onClick={() => add()}>
                        Tambah
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Form.List>
          <div className="mt-4 text-sm text-slate-600">
            Total sementara: {formatCurrency(computeItemTotal(createForm.getFieldValue("items") || []))}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
