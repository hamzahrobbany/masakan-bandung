"use client";

import { useCallback, useEffect, useState } from "react";
import { Descriptions, Tag, Table, Button, Select, message, Card, Typography, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ensureAdminToken } from "@/lib/admin-token";
import { ADMIN_TOKEN_HEADER } from "@/lib/security";
import { formatCurrency } from "@/lib/utils";

type OrderStatus = "PENDING" | "PROCESSED" | "DONE" | "CANCELLED";

type OrderItem = {
  id: string;
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
  items: OrderItem[];
};

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "PENDING" },
  { value: "PROCESSED", label: "PROCESSED" },
  { value: "DONE", label: "DONE" },
  { value: "CANCELLED", label: "CANCELLED" },
];

const { Title } = Typography;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const requestOrder = useCallback(async (): Promise<Order | null> => {
    let token: string;
    try {
      token = await ensureAdminToken();
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Token admin tidak ditemukan";
      message.error(messageText);
      return null;
    }

    const res = await fetch(`/api/admin/orders/${id}`, {
      headers: { [ADMIN_TOKEN_HEADER]: token },
    });
    if (!res.ok) {
      message.error("Gagal memuat detail pesanan");
      return null;
    }
    return (await res.json()) as Order;
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    void (async () => {
      const data = await requestOrder();
      if (isMounted && data) {
        setOrder(data);
        setStatus(data.status);
      }
      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [requestOrder]);

  const updateStatus = useCallback(async () => {
    let token: string;
    try {
      token = await ensureAdminToken();
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Token admin tidak ditemukan";
      message.error(messageText);
      return;
    }
    setActionLoading(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        [ADMIN_TOKEN_HEADER]: token,
      },
      body: JSON.stringify({ status }),
    });

    message.success("Status diperbarui");
    const latest = await requestOrder();
    if (latest) {
      setOrder(latest);
      setStatus(latest.status);
    }
    setActionLoading(false);
  }, [id, requestOrder, status]);

  const columns: ColumnsType<OrderItem> = [
    { title: "Menu", dataIndex: "foodName" },
    {
      title: "Harga",
      dataIndex: "foodPrice",
      render: (value: number) => formatCurrency(value),
    },
    { title: "Qty", dataIndex: "quantity" },
    {
      title: "Total",
      render: (_, item) => formatCurrency(item.foodPrice * item.quantity),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Title level={3} className="!mb-0">
          Detail Pesanan
        </Title>
        <Link href="/admin/orders" className="text-amber-700 text-sm">
          Kembali ke daftar
        </Link>
      </div>

      <Card loading={loading}>
        {order && (
          <Descriptions bordered column={1} className="mb-6">
            <Descriptions.Item label="Nama">
              {order.customerName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Telepon">
              {order.customerPhone || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Catatan">
              {order.note || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Total">
              {formatCurrency(order.total)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag>{order.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ubah Status">
              <Space>
                <Select<OrderStatus>
                  value={status}
                  style={{ width: 200 }}
                  onChange={(value) => setStatus(value)}
                  options={STATUS_OPTIONS}
                />
                <Button type="primary" onClick={updateStatus} loading={actionLoading}>
                  Update
                </Button>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}

        {order && (
          <>
            <h2 className="text-lg font-bold mb-2">Items</h2>
            <Table<OrderItem> dataSource={order.items} rowKey="id" columns={columns} pagination={false} />
          </>
        )}
      </Card>
    </div>
  );
}
