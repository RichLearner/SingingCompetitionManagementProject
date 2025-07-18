"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Trophy,
  Users,
  UserCheck,
  Settings,
  BarChart3,
  Calendar,
  Award,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "儀表板", icon: Home },
  { href: "/admin/competitions", label: "競賽管理", icon: Trophy },
  { href: "/admin/groups", label: "隊伍管理", icon: Users },
  { href: "/admin/participants", label: "參賽者管理", icon: UserCheck },
  { href: "/admin/judges", label: "評審管理", icon: Award },
  { href: "/admin/rounds", label: "回合管理", icon: Calendar },
  { href: "/admin/scoring", label: "評分管理", icon: BarChart3 },
  { href: "/admin/settings", label: "系統設定", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  return (
    <nav className="mt-8">
      <div className="px-4 space-y-1">
        {navItems.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive =
            pathname === fullHref ||
            (item.href !== "/admin" && pathname.startsWith(fullHref));

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
