"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Pause, Trash2, Settings } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  deleteCompetition,
  updateCompetitionStatus,
} from "@/lib/actions/competitions";

interface Competition {
  id: string;
  name: string;
  status: string;
  current_round: number;
  total_rounds: number;
}

interface CompetitionActionsProps {
  competition: Competition;
  locale: string;
}

export function CompetitionActions({
  competition,
  locale,
}: CompetitionActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      await updateCompetitionStatus(competition.id, newStatus);
      router.refresh();
    } catch (error) {
      console.error("Error updating competition status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("competition.deleteConfirm", { name: competition.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteCompetition(competition.id);
      router.refresh();
    } catch (error) {
      console.error("Error deleting competition:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
          <span className="sr-only">{t("common.actions")}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {competition.status === "draft" && (
          <DropdownMenuItem onClick={() => handleStatusChange("active")}>
            <Play className="mr-2 h-4 w-4" />
            {t("competition.start")}
          </DropdownMenuItem>
        )}

        {competition.status === "active" && (
          <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
            <Pause className="mr-2 h-4 w-4" />
            {t("competition.end")}
          </DropdownMenuItem>
        )}

        {competition.status === "completed" && (
          <DropdownMenuItem onClick={() => handleStatusChange("active")}>
            <Play className="mr-2 h-4 w-4" />
            {t("competition.restart")}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/${locale}/admin/competitions/${competition.id}/settings`
            )
          }
        >
          <Settings className="mr-2 h-4 w-4" />
          {t("admin.settings")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("common.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
