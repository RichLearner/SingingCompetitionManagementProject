"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { submitBatchScores } from "@/lib/actions/judge-scores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Save,
  Loader2,
  Star,
  AlertCircle,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface ScoringFactor {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  max_score: number;
  weight: number;
  order_index: number;
}

interface Group {
  id: string;
  name: string;
  photo_url?: string;
  participants?: any[];
}

interface ExistingScore {
  factor_id: string;
  score: number;
  comments?: string;
}

interface BatchScoreFormProps {
  competitionId: string;
  roundId: string;
  judgeId: string;
  groups: Group[];
  scoringFactors: ScoringFactor[];
  existingScores: Record<string, Record<string, ExistingScore>>;
  locale: string;
}

export function BatchScoreForm({
  competitionId,
  roundId,
  judgeId,
  groups,
  scoringFactors,
  existingScores,
  locale,
}: BatchScoreFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [formData, setFormData] = useState(() => {
    const initialData: Record<
      string,
      Record<string, { score: number; comments: string }>
    > = {};

    groups.forEach((group) => {
      initialData[group.id] = {};
      scoringFactors.forEach((factor) => {
        const existingScore = existingScores[group.id]?.[factor.id];
        initialData[group.id][factor.id] = {
          score: existingScore?.score || 0,
          comments: existingScore?.comments || "",
        };
      });
    });

    return initialData;
  });

  const currentGroup = groups[currentGroupIndex];
  const currentGroupScores = formData[currentGroup.id] || {};

  const handleScoreChange = (factorId: string, score: number) => {
    setFormData((prev) => ({
      ...prev,
      [currentGroup.id]: {
        ...prev[currentGroup.id],
        [factorId]: {
          ...prev[currentGroup.id]?.[factorId],
          score: Math.max(0, Math.min(10, score)),
        },
      },
    }));
  };

  const handleCommentsChange = (factorId: string, comments: string) => {
    setFormData((prev) => ({
      ...prev,
      [currentGroup.id]: {
        ...prev[currentGroup.id],
        [factorId]: {
          ...prev[currentGroup.id]?.[factorId],
          comments,
        },
      },
    }));
  };

  const validateCurrentGroup = () => {
    const errors: string[] = [];

    scoringFactors.forEach((factor) => {
      const factorData = currentGroupScores[factor.id];
      if (
        !factorData ||
        factorData.score < 0 ||
        factorData.score > factor.max_score
      ) {
        errors.push(
          `${factor.name}: ${t("judge.invalidScore", {
            min: 0,
            max: factor.max_score,
          })}`
        );
      }
    });

    return errors;
  };

  const handleNextGroup = () => {
    const validationErrors = validateCurrentGroup();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setError(null);
    }
  };

  const handlePreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
      setError(null);
    }
  };

  const handleSubmitAll = async () => {
    setError(null);

    // Validate all groups
    const allErrors: string[] = [];
    groups.forEach((group) => {
      const groupScores = formData[group.id] || {};
      scoringFactors.forEach((factor) => {
        const factorData = groupScores[factor.id];
        if (
          !factorData ||
          factorData.score < 0 ||
          factorData.score > factor.max_score
        ) {
          allErrors.push(
            `${group.name} - ${factor.name}: ${t("judge.invalidScore", {
              min: 0,
              max: factor.max_score,
            })}`
          );
        }
      });
    });

    if (allErrors.length > 0) {
      setError(allErrors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit scores for all groups
      for (const group of groups) {
        const groupScores = formData[group.id] || {};
        const scores = scoringFactors.map((factor) => ({
          factorId: factor.id,
          score: groupScores[factor.id]?.score || 0,
          comments: groupScores[factor.id]?.comments || "",
        }));

        await submitBatchScores({
          competitionId,
          groupId: group.id,
          roundId,
          scores,
        });
      }

      toast.success(t("judge.allScoresSubmitted"));
      router.push(`/${locale}/judge/competitions/${competitionId}`);
    } catch (error) {
      console.error("Error submitting batch scores:", error);
      setError(error instanceof Error ? error.message : t("judge.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateGroupTotalScore = (groupId: string) => {
    const groupScores = formData[groupId] || {};
    return scoringFactors.reduce((total, factor) => {
      const score = groupScores[factor.id]?.score || 0;
      return total + score * factor.weight;
    }, 0);
  };

  const calculateMaxPossibleScore = () => {
    return scoringFactors.reduce((total, factor) => {
      return total + factor.max_score * factor.weight;
    }, 0);
  };

  const getGroupCompletionStatus = (groupId: string) => {
    const groupScores = formData[groupId] || {};
    const completedFactors = scoringFactors.filter(
      (factor) => groupScores[factor.id]?.score > 0
    ).length;
    return {
      completed: completedFactors,
      total: scoringFactors.length,
      percentage: (completedFactors / scoringFactors.length) * 100,
    };
  };

  const maxPossibleScore = calculateMaxPossibleScore();
  const currentGroupTotal = calculateGroupTotalScore(currentGroup.id);
  const currentGroupPercentage =
    maxPossibleScore > 0 ? (currentGroupTotal / maxPossibleScore) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-blue-900">
            {t("judge.batchProgress")}
          </h3>
          <Badge variant="outline" className="text-blue-700">
            {currentGroupIndex + 1} / {groups.length}
          </Badge>
        </div>
        <Progress
          value={(currentGroupIndex / (groups.length - 1)) * 100}
          className="mb-2"
        />
        <div className="text-sm text-blue-700">
          {t("judge.scoringGroup")} {currentGroupIndex + 1} {t("judge.of")}{" "}
          {groups.length}
        </div>
      </div>

      {/* Group Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousGroup}
          disabled={currentGroupIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.previous")}
        </Button>

        <div className="flex items-center space-x-2">
          {groups.map((group, index) => {
            const status = getGroupCompletionStatus(group.id);
            return (
              <div
                key={group.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer ${
                  index === currentGroupIndex
                    ? "bg-blue-600 text-white"
                    : status.percentage === 100
                    ? "bg-green-600 text-white"
                    : status.percentage > 0
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                onClick={() => setCurrentGroupIndex(index)}
              >
                {status.percentage === 100 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          onClick={handleNextGroup}
          disabled={currentGroupIndex === groups.length - 1}
        >
          {t("common.next")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Current Group Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{currentGroup.name}</span>
            <Badge variant="outline">
              {getGroupCompletionStatus(currentGroup.id).completed} /{" "}
              {scoringFactors.length} {t("judge.completed")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {currentGroup.photo_url ? (
                <img
                  src={currentGroup.photo_url}
                  alt={currentGroup.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <Users className="h-8 w-8 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{currentGroup.name}</h3>
              <p className="text-gray-600">
                {currentGroup.participants?.length || 0}{" "}
                {t("judge.participants")}
              </p>
            </div>
          </div>

          {/* Score Summary */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blue-900">
                {t("judge.currentGroupScore")}
              </h4>
              <Badge variant="outline" className="text-blue-700">
                {currentGroupTotal.toFixed(1)} / {maxPossibleScore.toFixed(1)} (
                {currentGroupPercentage.toFixed(1)}%)
              </Badge>
            </div>
            <Progress value={currentGroupPercentage} className="h-2" />
          </div>

          {/* Scoring Factors */}
          <div className="space-y-4">
            {scoringFactors.map((factor) => {
              const factorData = currentGroupScores[factor.id] || {
                score: 0,
                comments: "",
              };
              const isCompleted = factorData.score > 0;
              const factorName =
                locale === "zh-TW"
                  ? factor.name
                  : factor.name_en || factor.name;

              return (
                <Card
                  key={factor.id}
                  className={`${
                    isCompleted ? "border-green-200 bg-green-50" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star
                          className={`h-5 w-5 ${
                            isCompleted ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <span className="text-lg">{factorName}</span>
                        <Badge variant="outline">
                          {t("judge.weight")}: {factor.weight}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {t("judge.currentScore")}: {factorData.score} /{" "}
                          {factor.max_score}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t("judge.weightedScore")}:{" "}
                          {(factorData.score * factor.weight).toFixed(1)}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {factor.description && (
                        <p className="text-sm text-gray-600">
                          {factor.description}
                        </p>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`score-${factor.id}`}>
                            {t("judge.score")} (0-{factor.max_score})
                          </Label>
                          <Input
                            id={`score-${factor.id}`}
                            type="number"
                            min="0"
                            max={factor.max_score}
                            step="0.1"
                            value={factorData.score}
                            onChange={(e) =>
                              handleScoreChange(
                                factor.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-center font-semibold"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`comments-${factor.id}`}>
                            {t("judge.comments")} ({t("common.optional")})
                          </Label>
                          <Textarea
                            id={`comments-${factor.id}`}
                            value={factorData.comments}
                            onChange={(e) =>
                              handleCommentsChange(factor.id, e.target.value)
                            }
                            placeholder={t("judge.commentsPlaceholder")}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(`/${locale}/judge/competitions/${competitionId}`)
          }
        >
          {t("common.cancel")}
        </Button>

        <div className="flex space-x-2">
          {currentGroupIndex < groups.length - 1 && (
            <Button type="button" onClick={handleNextGroup}>
              {t("common.next")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            onClick={handleSubmitAll}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("judge.submitAllScores")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
