import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            {t("app.title")}
          </h1>
          <p className="text-xl text-gray-600 mb-8">{t("app.description")}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {t("admin.title")}
            </Link>
            <Link
              href="/judge"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {t("judge.title")}
            </Link>
            <Link
              href="/vote"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {t("voting.title")}
            </Link>
            <Link
              href="/scoreboard"
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {t("scoreboard.title")}
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("admin.title")}
            </h3>
            <p className="text-gray-600 text-sm">
              {t("admin.dashboard")} - {t("competition.title")},{" "}
              {t("round.title")}, {t("group.title")}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("judge.title")}
            </h3>
            <p className="text-gray-600 text-sm">
              {t("scoring.title")} - {t("scoring.factors")}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("voting.title")}
            </h3>
            <p className="text-gray-600 text-sm">
              {t("voting.selectGroups")} - {t("voting.phoneNumber")}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("scoreboard.title")}
            </h3>
            <p className="text-gray-600 text-sm">
              {t("results.title")} - {t("scoreboard.finalResults")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
