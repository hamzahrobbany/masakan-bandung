"use client";

import { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useRouter, useParams } from "next/navigation";

export default function EditCategoryPage() {
  const params = useParams();
  const id = params.id;
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/categories/${id}`)
      .then((res) => res.json())
      .then((data) => form.setFieldsValue(data));
  }, [id, form]);

  const onFinish = async (values: any) => {
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });

    message.success("Kategori diperbarui");
    router.push("/admin/categories");
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Edit Kategori</h1>

      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 400 }}>
        <Form.Item
          name="name"
          label="Nama Kategori"
          rules={[{ required: true, message: "Nama kategori wajib diisi" }]}
        >
          <Input />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Update
        </Button>
      </Form>
    </div>
  );
}
