import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Database,
  Users,
  Globe,
  FileText,
  Shield,
  Bell,
  Palette,
  Server,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function GlobalSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();

  const { locale } = await params;
  const t = await getTranslations({ locale });

  const settingsCategories = [
    {
      id: "system",
      title: t("settings.system"),
      description: t("settings.systemDescription"),
      icon: <Server className="h-6 w-6" />,
      items: [
        {
          title: t("settings.databaseSettings"),
          description: t("settings.databaseSettingsDescription"),
          href: `/${locale}/admin/settings/database`,
          icon: <Database className="h-4 w-4" />,
        },
        {
          title: t("settings.backupRestore"),
          description: t("settings.backupRestoreDescription"),
          href: `/${locale}/admin/settings/backup`,
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "users",
      title: t("settings.userManagement"),
      description: t("settings.userManagementDescription"),
      icon: <Users className="h-6 w-6" />,
      items: [
        {
          title: t("settings.adminUsers"),
          description: t("settings.adminUsersDescription"),
          href: `/${locale}/admin/settings/users`,
          icon: <Shield className="h-4 w-4" />,
        },
        {
          title: t("settings.judgePermissions"),
          description: t("settings.judgePermissionsDescription"),
          href: `/${locale}/admin/settings/permissions`,
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "appearance",
      title: t("settings.appearance"),
      description: t("settings.appearanceDescription"),
      icon: <Palette className="h-6 w-6" />,
      items: [
        {
          title: t("settings.theme"),
          description: t("settings.themeDescription"),
          href: `/${locale}/admin/settings/theme`,
          icon: <Palette className="h-4 w-4" />,
        },
        {
          title: t("settings.branding"),
          description: t("settings.brandingDescription"),
          href: `/${locale}/admin/settings/branding`,
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "localization",
      title: t("settings.localization"),
      description: t("settings.localizationDescription"),
      icon: <Globe className="h-6 w-6" />,
      items: [
        {
          title: t("settings.languages"),
          description: t("settings.languagesDescription"),
          href: `/${locale}/admin/settings/languages`,
          icon: <Globe className="h-4 w-4" />,
        },
        {
          title: t("settings.timezone"),
          description: t("settings.timezoneDescription"),
          href: `/${locale}/admin/settings/timezone`,
          icon: <Globe className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "notifications",
      title: t("settings.notifications"),
      description: t("settings.notificationsDescription"),
      icon: <Bell className="h-6 w-6" />,
      items: [
        {
          title: t("settings.emailNotifications"),
          description: t("settings.emailNotificationsDescription"),
          href: `/${locale}/admin/settings/email`,
          icon: <Bell className="h-4 w-4" />,
        },
        {
          title: t("settings.smsNotifications"),
          description: t("settings.smsNotificationsDescription"),
          href: `/${locale}/admin/settings/sms`,
          icon: <Bell className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.settings")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("settings.globalDescription")}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            {t("settings.systemInfo")}
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("settings.systemStatus")}
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {t("settings.online")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.systemStatusDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("settings.databaseStatus")}
            </CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {t("settings.connected")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.databaseStatusDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("settings.version")}
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">v1.0.0</div>
            <p className="text-xs text-muted-foreground">
              {t("settings.versionDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("settings.uptime")}
            </CardTitle>
            <Server className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">99.9%</div>
            <p className="text-xs text-muted-foreground">
              {t("settings.uptimeDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Categories */}
      <div className="space-y-6">
        {settingsCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {category.icon}
                <span>{category.title}</span>
              </CardTitle>
              <p className="text-sm text-gray-600">{category.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {category.items.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-600">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{t("settings.configure")}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("settings.quickActions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              {t("settings.exportData")}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Database className="mr-2 h-4 w-4" />
              {t("settings.backupDatabase")}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              {t("settings.manageUsers")}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Bell className="mr-2 h-4 w-4" />
              {t("settings.testNotifications")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("settings.systemInformation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">
                {t("settings.applicationInfo")}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("settings.appName")}</span>
                  <span>803 Event</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("settings.appVersion")}</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("settings.buildDate")}</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">
                {t("settings.technicalInfo")}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("settings.framework")}</span>
                  <span>Next.js 14</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("settings.database")}</span>
                  <span>Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("settings.authentication")}</span>
                  <span>Clerk</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
