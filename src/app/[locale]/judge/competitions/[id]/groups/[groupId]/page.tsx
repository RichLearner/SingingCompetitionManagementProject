import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Star, Save } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { requireJudgeAccess } from "@/lib/actions/judge-auth";
import { notFound } from "next/navigation";
import { JudgeScoreForm } from "@/components/judge/JudgeScoreForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function JudgeGroupScoringPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; groupId: string }>;
}) {
  const judge = await requireJudgeAccess();
  const { locale, id, groupId } = await params;
  const t = await getTranslations({ locale });

  // Fetch judge assignment and verify access
  const { data: judgeAssignment, error: judgeError } = await supabase
    .from("judges")
    .select(
      `
      *,
      competition:competitions(
        id,
        name,
        status,
        current_round,
        total_rounds
      )
    `
    )
    .eq("id", judge.id)
    .eq("competition_id", id)
    .eq("is_active", true)
    .single();

  if (judgeError || !judgeAssignment) {
    notFound();
  }

  const competition = judgeAssignment.competition;

  // Fetch current round information
  const { data: currentRound, error: roundError } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .eq("round_number", competition.current_round)
    .single();

  if (!currentRound) {
    notFound();
  }

  // Fetch the specific group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select(
      `
      *,
      participants:participants!participants_group_id_fkey(*)
    `
    )
    .eq("id", groupId)
    .eq("competition_id", id)
    .eq("is_eliminated", false)
    .single();

  if (groupError || !group) {
    notFound();
  }

  // Fetch scoring factors
  const { data: scoringFactors } = await supabase
    .from("scoring_factors")
    .select("*")
    .eq("competition_id", id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Fetch existing scores for this judge/group/round
  const { data: existingScores } = await supabase
    .from("judge_scores")
    .select("*")
    .eq("judge_id", judgeAssignment.id)
    .eq("group_id", groupId)
    .eq("round_id", currentRound.id)
    .order("created_at", { ascending: true });

  // Create a map of existing scores by factor_id
  const scoresByFactor =
    existingScores?.reduce((acc, score) => {
      acc[score.factor_id] = score;
      return acc;
    }, {} as Record<string, any>) || {};

  // Calculate completion status
  const totalFactors = scoringFactors?.length || 0;
  const completedFactors = existingScores?.length || 0;
  const isCompleted = completedFactors >= totalFactors;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/judge/competitions/${id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <p className="text-gray-600 mt-2">
                {competition.name} - {t("judge.round")}{" "}
                {competition.current_round}
              </p>
            </div>
          </div>
          <Badge variant={isCompleted ? "default" : "secondary"}>
            {isCompleted ? t("judge.completed") : t("judge.inProgress")}
          </Badge>
        </div>

        {/* Group Information */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>{t("judge.groupInformation")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {group.photo_url ? (
                      <img
                        src={group.photo_url}
                        alt={group.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-8 w-8 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <p className="text-gray-600">
                      {group.participants?.length || 0}{" "}
                      {t("judge.participants")}
                    </p>
                  </div>
                </div>

                {group.participants && group.participants.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      {t("judge.participants")}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.participants.map((participant: any) => (
                        <Badge key={participant.id} variant="outline">
                          {participant.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>{t("judge.scoringProgress")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("judge.progress")}
                  </span>
                  <span className="text-sm text-gray-600">
                    {completedFactors}/{totalFactors} {t("judge.factors")}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        totalFactors > 0
                          ? (completedFactors / totalFactors) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {isCompleted ? (
                    <span className="text-green-600 font-medium">
                      ✓ {t("judge.allFactorsCompleted")}
                    </span>
                  ) : (
                    <span>
                      {totalFactors - completedFactors}{" "}
                      {t("judge.factorsRemaining")}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoring Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>{t("judge.scoringForm")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JudgeScoreForm
              competitionId={id}
              groupId={groupId}
              roundId={currentRound.id}
              judgeId={judgeAssignment.id}
              scoringFactors={scoringFactors || []}
              existingScores={scoresByFactor}
              locale={locale}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
