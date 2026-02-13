import { SurveyForm } from "./_components/survey-form";

interface SurveyPageProps {
  params: Promise<{ token: string }>;
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { token } = await params;
  return <SurveyForm token={token} />;
}
