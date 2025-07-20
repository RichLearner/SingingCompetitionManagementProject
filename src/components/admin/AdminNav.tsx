"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Monitor,
  Calculator,
} from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  const navItems = [
    { href: "/admin", label: t("admin.dashboard"), icon: Home },
    {
      href: "/admin/competitions",
      label: t("admin.competitions"),
      icon: Trophy,
    },
    { href: "/admin/groups", label: t("admin.groups"), icon: Users },
    {
      href: "/admin/participants",
      label: t("admin.participants"),
      icon: UserCheck,
    },
    { href: "/admin/judges", label: t("admin.judges"), icon: Award },
    { href: "/admin/rounds", label: t("admin.rounds"), icon: Calendar },
    { href: "/admin/scoring", label: t("scoring.title"), icon: BarChart3 },
    {
      href: "/admin/calculate-results",
      label: t("round.calculateResults"),
      icon: Calculator,
    },
    {
      href: "/admin/recalculate-results",
      label: t("round.recalculateResults"),
      icon: Calculator,
    },
    { href: "/led", label: t("led.title"), icon: Monitor },
    { href: "/admin/settings", label: t("admin.settings"), icon: Settings },
  ];

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
