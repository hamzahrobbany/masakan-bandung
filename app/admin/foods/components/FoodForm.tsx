"use client";

import { useEffect } from "react";
import { Form, Input, InputNumber, Button, Select, message } from "antd";

export default function FoodForm({ categories, editing, onSuccess }: any) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editing) {
      form.setFieldsValue(editing);
    }
  }, [editing]);

  const onFinish = async (values: any) => {
    const url = editing ? `/api/foods/${editing.id}` : "/api/foods";

    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      message.error("Gagal menyimpan makanan");
      return;
    }

    message.success("Berhasil disimpan");
    onSuccess();
  };

  return (
    <Form layout="vertical" onFinish={onFinish} form={form}>
      <Form.Item
        name="name"
        label="Nama Makanan"
        rules={[{ required: true }]}
      >
        <Input placeholder="Contoh: Seblak Ceker" />
      </Form.Item>

      <Form.Item
        name="price"
        label="Harga"
        rules={[{ required: true }]}
      >
        <InputNumber
          min={0}
          className="w-full"
          placeholder="Contoh: 15000"
        />
      </Form.Item>

      <Form.Item name="description" label="Deskripsi">
        <Input.TextArea rows={3} />
      </Form.Item>

      <Form.Item
        name="imageUrl"
        label="URL Gambar"
        rules={[{ required: true }]}
      >
        <Input placeholder="https://..." />
      </Form.Item>

      <Form.Item
        name="categoryId"
        label="Kategori"
        rules={[{ required: true }]}
      >
        <Select placeholder="Pilih kategori">
          {categories.map((cat: any) => (
            <Select.Option key={cat.id} value={cat.id}>
              {cat.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Button type="primary" htmlType="submit" block>
        Simpan Makanan
      </Button>
    </Form>
  );
}
