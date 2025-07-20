import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Monitor,
  RefreshCw,
  Palette,
  Eye,
  Clock,
  ArrowLeft,
  Save,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function LEDSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch LED screen settings from database (you might want to create a settings table)
  // For now, we'll use default values

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/led`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("led.displaySettings")}
              </h1>
              <p className="text-gray-600">
                {t("led.configureDisplayOptions")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-gray-500" />
            <Badge variant="secondary">Admin</Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>{t("led.displayConfiguration")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="refresh-interval">
                  {t("led.refreshInterval")}
                </Label>
                <Select defaultValue="5">
                  <SelectTrigger>
                    <SelectValue placeholder={t("led.selectRefreshInterval")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 {t("led.second")}</SelectItem>
                    <SelectItem value="3">3 {t("led.seconds")}</SelectItem>
                    <SelectItem value="5">5 {t("led.seconds")}</SelectItem>
                    <SelectItem value="10">10 {t("led.seconds")}</SelectItem>
                    <SelectItem value="30">30 {t("led.seconds")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  {t("led.refreshIntervalDescription")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display-mode">{t("led.displayMode")}</Label>
                <Select defaultValue="all-competitions">
                  <SelectTrigger>
                    <SelectValue placeholder={t("led.selectDisplayMode")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-competitions">
                      {t("led.allActiveCompetitions")}
                    </SelectItem>
                    <SelectItem value="single-competition">
                      {t("led.singleCompetition")}
                    </SelectItem>
                    <SelectItem value="top-results">
                      {t("led.topResultsOnly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-results">{t("led.maxResultsToShow")}</Label>
                <Input
                  id="max-results"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="6"
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  {t("led.maxResultsDescription")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Visual Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>{t("led.visualSettings")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">{t("led.colorTheme")}</Label>
                <Select defaultValue="dark">
                  <SelectTrigger>
                    <SelectValue placeholder={t("led.selectTheme")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">{t("led.darkTheme")}</SelectItem>
                    <SelectItem value="light">{t("led.lightTheme")}</SelectItem>
                    <SelectItem value="high-contrast">
                      {t("led.highContrast")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">{t("led.fontSize")}</Label>
                <Select defaultValue="large">
                  <SelectTrigger>
                    <SelectValue placeholder={t("led.selectFontSize")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t("led.small")}</SelectItem>
                    <SelectItem value="medium">{t("led.medium")}</SelectItem>
                    <SelectItem value="large">{t("led.large")}</SelectItem>
                    <SelectItem value="extra-large">
                      {t("led.extraLarge")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-animations">
                    {t("led.showAnimations")}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t("led.animationsDescription")}
                  </p>
                </div>
                <Switch id="show-animations" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-timestamps">
                    {t("led.showTimestamps")}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t("led.timestampsDescription")}
                  </p>
                </div>
                <Switch id="show-timestamps" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Content Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>{t("led.contentSettings")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-group-photos">
                    {t("led.showGroupPhotos")}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t("led.groupPhotosDescription")}
                  </p>
                </div>
                <Switch id="show-group-photos" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-participant-count">
                    {t("led.showParticipantCount")}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t("led.participantCountDescription")}
                  </p>
                </div>
                <Switch id="show-participant-count" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-public-votes">
                    {t("led.showPublicVotes")}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t("led.publicVotesDescription")}
                  </p>
                </div>
                <Switch id="show-public-votes" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-judge-scores">
                    {t("led.showJudgeScores")}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t("led.judgeScoresDescription")}
                  </p>
                </div>
                <Switch id="show-judge-scores" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>{t("led.preview")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-black text-white p-4 rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-yellow-400 mb-2">
                    Live Results
                  </h3>
                  <p className="text-sm text-gray-300">
                    Real-time Competition Updates
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">#1 Group A</span>
                      <span className="text-2xl font-bold text-yellow-400">
                        85
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">#2 Group B</span>
                      <span className="text-2xl font-bold text-gray-300">
                        82
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/${locale}/led/realtime`}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("led.viewLive")}
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/${locale}/led`}>
                    <Monitor className="mr-2 h-4 w-4" />
                    {t("led.viewStatic")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button className="px-8">
            <Save className="mr-2 h-4 w-4" />
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
