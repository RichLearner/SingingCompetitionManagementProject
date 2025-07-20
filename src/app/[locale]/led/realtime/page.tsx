import { RealtimeLEDScreen } from "@/components/led/RealtimeLEDScreen";

export default async function RealtimeLEDPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <RealtimeLEDScreen locale={locale} refreshInterval={3000} />;
}
