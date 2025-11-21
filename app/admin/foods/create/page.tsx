"use client";

import { useEffect, useState } from "react";
import { Form, Input, Button, InputNumber, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

export default function CreateFoodPage() {
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    setCategories(json);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onFinish = async (values: any) => {
    await fetch("/api/foods", {
      method: "POST",
      body: JSON.stringify(values),
    });

    message.success("Food ditambahkan");
    router.push("/admin/foods");
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Tambah Food</h1>

      <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 500 }}>
        <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="price" label="Harga" rules={[{ required: true }]}>
          <InputNumber min={0} className="w-full" />
        </Form.Item>

        <Form.Item name="categoryId" label="Kategori" rules={[{ required: true }]}>
          <Select
            options={categories.map((c: any) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </Form.Item>

        <Form.Item name="imageUrl" label="URL Gambar (sementara)">
          <Input placeholder="https://..." />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Simpan
        </Button>
      </Form>
    </div>
  );
}
