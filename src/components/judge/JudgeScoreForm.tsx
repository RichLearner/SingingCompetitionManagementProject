"use client";

import { useState } from "react";
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
import { Save, Loader2, Star, AlertCircle } from "lucide-react";
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

interface ExistingScore {
  factor_id: string;
  score: number;
  comments?: string;
}

interface JudgeScoreFormProps {
  competitionId: string;
  groupId: string;
  roundId: string;
  judgeId: string;
  scoringFactors: ScoringFactor[];
  existingScores: Record<string, ExistingScore>;
  locale: string;
}

export function JudgeScoreForm({
  competitionId,
  groupId,
  roundId,
  judgeId,
  scoringFactors,
  existingScores,
  locale,
}: JudgeScoreFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => {
    const initialData: Record<string, { score: number; comments: string }> = {};

    scoringFactors.forEach((factor) => {
      const existingScore = existingScores[factor.id];
      initialData[factor.id] = {
        score: existingScore?.score || 0,
        comments: existingScore?.comments || "",
      };
    });

    return initialData;
  });

  const handleScoreChange = (factorId: string, score: number) => {
    // Convert to whole number and clamp to valid range
    const wholeNumber = Math.round(score);
    const maxScore =
      scoringFactors.find((f) => f.id === factorId)?.max_score || 10;
    const clampedScore = Math.max(0, Math.min(maxScore, wholeNumber));

    setFormData((prev) => ({
      ...prev,
      [factorId]: {
        ...prev[factorId],
        score: clampedScore,
      },
    }));
  };

  const handleCommentsChange = (factorId: string, comments: string) => {
    setFormData((prev) => ({
      ...prev,
      [factorId]: {
        ...prev[factorId],
        comments,
      },
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    scoringFactors.forEach((factor) => {
      const factorData = formData[factor.id];
      if (
        !factorData ||
        factorData.score < 0 ||
        factorData.score > factor.max_score ||
        !Number.isInteger(factorData.score)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {
      const scores = scoringFactors.map((factor) => ({
        factorId: factor.id,
        score: formData[factor.id].score,
        comments: formData[factor.id].comments,
      }));

      await submitBatchScores({
        competitionId,
        groupId,
        roundId,
        scores,
      });

      toast.success(t("judge.scoresSubmitted"));
      router.push(`/${locale}/judge/competitions/${competitionId}`);
    } catch (error) {
      console.error("Error submitting scores:", error);
      setError(error instanceof Error ? error.message : t("judge.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalScore = () => {
    return scoringFactors.reduce((total, factor) => {
      const score = formData[factor.id]?.score || 0;
      return total + score * factor.weight;
    }, 0);
  };

  const calculateMaxPossibleScore = () => {
    return scoringFactors.reduce((total, factor) => {
      return total + factor.max_score * factor.weight;
    }, 0);
  };

  const totalScore = calculateTotalScore();
  const maxPossibleScore = calculateMaxPossibleScore();
  const scorePercentage =
    maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Score Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-blue-900">
            {t("judge.scoreSummary")}
          </h3>
          <Badge variant="outline" className="text-blue-700">
            {Math.round(totalScore)} / {Math.round(maxPossibleScore)} (
            {scorePercentage.toFixed(1)}%)
          </Badge>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
      </div>

      {/* Scoring Factors */}
      <div className="space-y-4">
        {scoringFactors.map((factor, index) => {
          const factorData = formData[factor.id] || { score: 0, comments: "" };
          const isCompleted = factorData.score > 0;
          const factorName =
            locale === "zh-TW" ? factor.name : factor.name_en || factor.name;

          return (
            <Card
              key={factor.id}
              className={`${isCompleted ? "border-green-200 bg-green-50" : ""}`}
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
                      {Math.round(factorData.score * factor.weight)}
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={
                          factorData.score === 0
                            ? ""
                            : factorData.score.toString()
                        }
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          const numValue = parseInt(value) || 0;
                          handleScoreChange(factor.id, numValue);
                        }}
                        onFocus={(e) => e.target.select()}
                        className="text-center font-semibold text-lg"
                        placeholder="0"
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

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("judge.submitScores")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
