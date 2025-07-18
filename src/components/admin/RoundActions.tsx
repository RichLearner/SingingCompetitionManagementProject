"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Play,
  Square,
  Edit,
  Trash2,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  deleteRound,
  startRound,
  endRound,
  updateRoundStatus,
} from "@/lib/actions/rounds";

interface Round {
  id: string;
  competition_id: string;
  round_number: number;
  name: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
}

interface RoundActionsProps {
  round: Round;
  locale: string;
}

export function RoundActions({ round, locale }: RoundActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  const handleStartRound = async () => {
    setIsLoading(true);
    try {
      await startRound(round.id, round.competition_id);
      router.refresh();
    } catch (error) {
      console.error("Error starting round:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndRound = async () => {
    if (!confirm(t("round.endConfirm", { name: round.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await endRound(round.id, round.competition_id);
      router.refresh();
    } catch (error) {
      console.error("Error ending round:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      await updateRoundStatus(round.id, newStatus, round.competition_id);
      router.refresh();
    } catch (error) {
      console.error("Error updating round status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("round.deleteConfirm", { name: round.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteRound(round.id, round.competition_id);
      router.refresh();
    } catch (error) {
      console.error("Error deleting round:", error);
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
        {/* Start Round */}
        {round.status === "pending" && (
          <DropdownMenuItem onClick={handleStartRound}>
            <Play className="mr-2 h-4 w-4" />
            {t("round.start")}
          </DropdownMenuItem>
        )}

        {/* End Round */}
        {round.status === "active" && (
          <DropdownMenuItem onClick={handleEndRound}>
            <Square className="mr-2 h-4 w-4" />
            {t("round.end")}
          </DropdownMenuItem>
        )}

        {/* Reactivate Round */}
        {round.status === "completed" && (
          <DropdownMenuItem onClick={() => handleStatusChange("active")}>
            <Play className="mr-2 h-4 w-4" />
            {t("round.reactivate")}
          </DropdownMenuItem>
        )}

        {/* Edit Round */}
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/${locale}/admin/competitions/${round.competition_id}/rounds/${round.id}/edit`
            )
          }
        >
          <Edit className="mr-2 h-4 w-4" />
          {t("common.edit")}
        </DropdownMenuItem>

        {/* Round Settings */}
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/${locale}/admin/competitions/${round.competition_id}/rounds/${round.id}/settings`
            )
          }
        >
          <Settings className="mr-2 h-4 w-4" />
          {t("admin.settings")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Delete Round */}
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
