"use client";

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  TagsOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";

const { Sider } = Layout;

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

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
        onClick={(info) => {
          if (info.key === "/admin/logout") {
            fetch("/api/admin/logout", { method: "POST" });
            router.push("/admin/login");
            return;
          }
          router.push(info.key);
        }}
      />
    </Sider>
  );
}
