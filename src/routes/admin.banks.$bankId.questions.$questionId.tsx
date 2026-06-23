import { createFileRoute, useParams } from "@tanstack/react-router";
import { QuestionEditor } from "./admin.banks.$bankId.questions.new";
import { getQuestionsForBank } from "@/data/questions";

export const Route = createFileRoute("/admin/banks/$bankId/questions/$questionId")({
  head: () => ({ meta: [{ title: "Admin · Edit Question — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: EditQuestionPage,
});

function EditQuestionPage() {
  const { bankId, questionId } = useParams({ from: "/admin/banks/$bankId/questions/$questionId" });
  const seed = getQuestionsForBank(bankId, 12);
  const q = seed.find((x) => x.id === questionId) ?? seed[0];
  return (
    <QuestionEditor
      bankId={bankId}
      mode="edit"
      initial={{
        stem: q.stem,
        difficulty: q.difficulty,
        topic: q.topic,
        tags: [],
        options: q.options,
        correctKey: q.correctKey,
        whyCorrect: q.whyCorrect,
      }}
    />
  );
}
