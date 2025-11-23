// app/admin/layout.tsx
import type { ReactNode } from "react";

import { Layout } from "antd";

import AdminSidebar from "./components/AdminSidebar";

const { Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Layout>
        <Content style={{ padding: "24px", background: "#f5f5f5" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
