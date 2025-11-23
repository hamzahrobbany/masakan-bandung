"use client";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  TagsOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { readAdminToken, clearAdminToken } from "@/lib/admin-token";
import { ADMIN_TOKEN_HEADER } from "@/lib/security";
const { Sider } = Layout;
export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const menuItems = [
    {
      key: "/admin",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/admin/foods",
      icon: <AppstoreOutlined />,
      label: "Makanan",
    },
    {
      key: "/admin/categories",
      icon: <TagsOutlined />,
      label: "Kategori",
    },
    {
      key: "/admin/logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Logout",
    },
  ];
  return (
    <Sider breakpoint="lg" collapsedWidth="0">
      <div className="p-4 text-white font-bold text-xl">Admin</div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={async (info) => {
          if (info.key === "/admin/logout") {
            if (loggingOut) return;
            const token = readAdminToken();
            if (!token) {
              router.push("/admin/login");
              return;
            }
            try {
              setLoggingOut(true);
              await fetch("/api/admin/logout", {
                method: "POST",
                headers: {
                  [ADMIN_TOKEN_HEADER]: token,
                },
              });
            } catch (error) {
              console.error("Logout gagal:", error);
            } finally {
              clearAdminToken();
              setLoggingOut(false);
              router.push("/admin/login");
            }
            return;
          }
          router.push(info.key);
        }}
      />
    </Sider>
  );
}