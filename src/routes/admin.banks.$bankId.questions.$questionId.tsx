import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { getQuestionsForBank } from "@/data/questions";
import { QuestionForm, type QuestionFormValues, type OptKey } from "@/components/admin/QuestionForm";

export const Route = createFileRoute("/admin/banks/$bankId/questions/$questionId")({
  head: () => ({ meta: [{ title: "Admin · Edit Question — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: EditQuestionPage,
});

function EditQuestionPage() {
  const { bankId, questionId } = Route.useParams();
  const navigate = useNavigate();
  const bank = questionBanks.find((b) => b.id === bankId);
  const seed = getQuestionsForBank(bankId, 12);
  const q = seed.find((x) => x.id === questionId) ?? seed[0];

  const initial: QuestionFormValues = {
    bankId,
    stem: q.stem,
    imageUrl: "",
    difficulty: q.difficulty,
    topic: q.topic,
    tags: q.related ?? [],
    options: q.options.map((o) => ({ key: o.key as OptKey, text: o.text })),
    correctKey: q.correctKey as OptKey,
    baseExplanation: q.whyCorrect ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/banks/$bankId/questions" params={{ bankId }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to questions
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Edit question</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{bank?.name ?? "Question bank"}</p>
      </div>

      <QuestionForm
        mode="edit"
        lockBank
        initial={initial}
        onCancel={() => navigate({ to: "/admin/banks/$bankId/questions", params: { bankId } })}
        onSubmit={() => {
          toast.success("Question updated");
          navigate({ to: "/admin/banks/$bankId/questions", params: { bankId } });
        }}
      />
    </div>
  );
}
