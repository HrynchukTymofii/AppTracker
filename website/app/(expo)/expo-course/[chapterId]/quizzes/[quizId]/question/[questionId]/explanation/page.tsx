import { ReadOnlyEditor } from "@/components/tiptap-templates/simple/readonly-editor";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    quizId: string;
    questionId: string;
  }>;
};

export default async function ExplanationPage({ params }: Props) {
  const {questionId } = await params;

  const question = await db.quizQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question?.note) return notFound();

  return (
    <div className="expo-content bg-[#f8fafc] dark:bg-[#0f172a] p-4 ">
      <ReadOnlyEditor initialContent={question.note} />
    </div>
  );
}
