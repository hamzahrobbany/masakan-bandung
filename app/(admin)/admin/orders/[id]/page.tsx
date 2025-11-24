"use client";

import { useCallback, useEffect, useState } from "react";
import { Descriptions, Tag, Table, Button, Select, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "next/navigation";

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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>("PENDING");

  const requestOrder = useCallback(async (): Promise<Order | null> => {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) {
      message.error("Gagal memuat detail pesanan");
      return null;
    }
    return (await res.json()) as Order;
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const data = await requestOrder();
      if (isMounted && data) {
        setOrder(data);
        setStatus(data.status);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [requestOrder]);

  const updateStatus = useCallback(async () => {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    message.success("Status diperbarui");
    const latest = await requestOrder();
    if (latest) {
      setOrder(latest);
      setStatus(latest.status);
    }
  }, [id, requestOrder, status]);

  const columns: ColumnsType<OrderItem> = [
    { title: "Menu", dataIndex: "foodName" },
    {
      title: "Harga",
      dataIndex: "foodPrice",
      render: (value: number) => `Rp ${value.toLocaleString()}`,
    },
    { title: "Qty", dataIndex: "quantity" },
    {
      title: "Total",
      render: (_, item) => `Rp ${(item.foodPrice * item.quantity).toLocaleString()}`,
    },
  ];

  return (
    <>
      <h1 className="text-xl font-bold mb-4">Detail Order</h1>

      {order && (
        <>
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
              Rp {order.total.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag>{order.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ubah Status">
              <Select<OrderStatus>
                value={status}
                style={{ width: 200 }}
                onChange={(value) => setStatus(value)}
                options={[
                  { value: "PENDING", label: "PENDING" },
                  { value: "PROCESSED", label: "PROCESSED" },
                  { value: "DONE", label: "DONE" },
                  { value: "CANCELLED", label: "CANCELLED" },
                ]}
              />
              <Button type="primary" className="ml-3" onClick={updateStatus}>
                Update
              </Button>
            </Descriptions.Item>
          </Descriptions>

          <h2 className="text-lg font-bold mb-2">Items</h2>
          <Table<OrderItem> dataSource={order.items} rowKey="id" columns={columns} pagination={false} />
        </>
      )}
    </>
  );
}
