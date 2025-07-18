"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCompetition,
  updateCompetition,
} from "@/lib/actions/competitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";

interface Competition {
  id?: string;
  name: string;
  name_en: string;
  description: string;
  status: string;
  current_round: number;
  total_rounds: number;
  voting_enabled: boolean;
  display_mode: string;
}

interface CompetitionFormProps {
  locale: string;
  competition?: Competition;
}

export function CompetitionForm({ locale, competition }: CompetitionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Competition>({
    name: competition?.name || "",
    name_en: competition?.name_en || "",
    description: competition?.description || "",
    status: competition?.status || "draft",
    current_round: competition?.current_round || 1,
    total_rounds: competition?.total_rounds || 2,
    voting_enabled: competition?.voting_enabled || false,
    display_mode: competition?.display_mode || "individual_scores",
    ...competition,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = e.target as HTMLFormElement;
      const formDataObj = new FormData(form);

      if (competition?.id) {
        // Update existing competition
        await updateCompetition(competition.id, formDataObj);
      } else {
        // Create new competition
        await createCompetition(formDataObj);
      }

      router.push(`/${locale}/admin/competitions`);
    } catch (error) {
      console.error("Error saving competition:", error);
      // TODO: Show error toast or message
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    field: keyof Competition,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">競賽名稱 (中文) *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="例如：803 Event 2024"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_en">競賽名稱 (英文)</Label>
          <Input
            id="name_en"
            name="name_en"
            value={formData.name_en}
            onChange={(e) => handleChange("name_en", e.target.value)}
            placeholder="e.g., 803 Event 2024"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">競賽描述</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="描述這個競賽的特色和規則..."
          rows={3}
        />
      </div>

      <Separator />

      {/* Competition Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">競賽設定</h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="status">競賽狀態</Label>
            <Select
              name="status"
              value={formData.status}
              onValueChange={(value: string) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="active">進行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_round">目前回合</Label>
            <Input
              id="current_round"
              name="current_round"
              type="number"
              min="1"
              max={formData.total_rounds}
              value={formData.current_round}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("current_round", parseInt(e.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_rounds">總回合數</Label>
            <Input
              id="total_rounds"
              name="total_rounds"
              type="number"
              min="1"
              max="10"
              value={formData.total_rounds}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("total_rounds", parseInt(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Voting Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">投票設定</h3>

        <div className="flex items-center space-x-2">
          <Switch
            id="voting_enabled"
            name="voting_enabled"
            checked={formData.voting_enabled}
            onCheckedChange={(checked: boolean) =>
              handleChange("voting_enabled", checked)
            }
          />
          <Label htmlFor="voting_enabled">啟用公眾投票</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_mode">顯示模式</Label>
          <Select
            name="display_mode"
            value={formData.display_mode}
            onValueChange={(value: string) =>
              handleChange("display_mode", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇顯示模式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual_scores">個別評分</SelectItem>
              <SelectItem value="total_scores">總分顯示</SelectItem>
              <SelectItem value="ranking_only">僅顯示排名</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Default Scoring Factors Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">預設評分項目</h3>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">803 Event 標準評分項目</CardTitle>
            <CardDescription>
              建立競賽後將自動建立以下評分項目，您可以在競賽設定中進行調整
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span>創意 (Creativity)</span>
                <span className="text-gray-600">滿分 10 分</span>
              </div>
              <div className="flex justify-between">
                <span>默契 (Teamwork)</span>
                <span className="text-gray-600">滿分 10 分</span>
              </div>
              <div className="flex justify-between">
                <span>氣氛 (Atmosphere)</span>
                <span className="text-gray-600">滿分 10 分</span>
              </div>
              <div className="flex justify-between">
                <span>演繹 (Performance)</span>
                <span className="text-gray-600">滿分 10 分</span>
              </div>
              <div className="flex justify-between">
                <span>演唱 (Singing)</span>
                <span className="text-gray-600">滿分 10 分</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              儲存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {competition ? "更新競賽" : "建立競賽"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
