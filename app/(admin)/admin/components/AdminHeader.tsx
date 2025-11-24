"use client";

import { Layout } from "antd";
const { Header } = Layout;

export default function AdminHeader() {
  return (
    <Header
      style={{
        padding: "0 16px",
        background: "#fff",
        borderBottom: "1px solid #eee",
        fontSize: 18,
        fontWeight: "bold",
      }}
    >
      Admin Panel
    </Header>
  );
}
