"use client";

import { useEffect, useState } from "react";
import { Descriptions, Tag, Table, Button, Select, message } from "antd";
import { useParams, useRouter } from "next/navigation";

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState("PENDING");

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${id}`);
    const json = await res.json();
    setOrder(json);
    setStatus(json.status);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateStatus = async () => {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });

    message.success("Status diperbarui");
    fetchOrder();
  };

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
              <Select
                value={status}
                style={{ width: 200 }}
                onChange={setStatus}
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
          <Table
            dataSource={order.items}
            rowKey="id"
            columns={[
              { title: "Menu", dataIndex: "foodName" },
              {
                title: "Harga",
                dataIndex: "foodPrice",
                render: (v: number) => `Rp ${v.toLocaleString()}`,
              },
              { title: "Qty", dataIndex: "quantity" },
              {
                title: "Total",
                render: (r: any) =>
                  `Rp ${(r.foodPrice * r.quantity).toLocaleString()}`,
              },
            ]}
          />
        </>
      )}
    </>
  );
}
