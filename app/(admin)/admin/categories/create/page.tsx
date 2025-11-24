"use client";

import { Form, Input, Button, message } from "antd";
import type { FormProps } from "antd";
import { useRouter } from "next/navigation";

type CategoryFormValues = {
  name: string;
};

export default function CreateCategoryPage() {
  const router = useRouter();

  const onFinish: FormProps<CategoryFormValues>["onFinish"] = async (values) => {
    await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    message.success("Kategori ditambahkan");
    router.push("/admin/categories");
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Tambah Kategori</h1>

      <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 400 }}>
        <Form.Item
          name="name"
          label="Nama Kategori"
          rules={[{ required: true, message: "Nama kategori wajib diisi" }]}
        >
          <Input placeholder="Masukkan nama kategori" />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Simpan
        </Button>
      </Form>
    </div>
  );
}
