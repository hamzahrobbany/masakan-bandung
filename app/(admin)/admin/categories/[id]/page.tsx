"use client";

import { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import type { FormProps } from "antd";
import { useRouter, useParams } from "next/navigation";

type CategoryFormValues = {
  name: string;
};

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<CategoryFormValues>();
  const router = useRouter();

  useEffect(() => {
    async function loadCategory() {
      const response = await fetch(`/api/categories/${id}`);
      if (!response.ok) {
        message.error("Gagal memuat kategori");
        return;
      }
      const data = (await response.json()) as CategoryFormValues;
      form.setFieldsValue(data);
    }

    void loadCategory();
  }, [form, id]);

  const onFinish: FormProps<CategoryFormValues>["onFinish"] = async (values) => {
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
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
