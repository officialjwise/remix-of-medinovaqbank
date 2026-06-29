import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  QuestionForm,
  type QuestionFormValues,
  type OptKey,
} from "@/components/admin/QuestionForm";
import {
  questionsApi,
  useAdminQuestions,
  useQuestionBanksLite,
  useUpdateQuestion,
  type AdminQuestion,
} from "@/api/questions.api";

export const Route = createFileRoute("/admin/banks/$bankId/questions/$questionId")({
  beforeLoad: () => requirePermission("questions.read"),
  head: () => ({
    meta: [
      { title: "Admin · Edit Question — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditQuestionPage,
});

function toFormValues(q: AdminQuestion): QuestionFormValues {
  return {
    bankId: q.bankId,
    stem: q.stem,
    imageUrl: q.imageUrl,
    difficulty: q.difficulty,
    topic: q.topic,
    tags: q.tags,
    options: q.options.map((o) => ({
      key: o.key as OptKey,
      text: o.text,
      imageUrl: o.imageUrl,
    })),
    correctKey: q.correctKey as OptKey,
    baseExplanation: q.baseExplanation,
  };
}

function EditQuestionPage() {
  const { bankId, questionId } = Route.useParams();
  const navigate = useNavigate();
  const { data: banks } = useQuestionBanksLite();
  const bank = banks?.find((b) => b.id === bankId);
  const update = useUpdateQuestion();

  // No single-question admin endpoint exists; pull the bank's questions and find by id.
  const { data, isLoading } = useAdminQuestions({ bankId, limit: 100 });
  const q = data?.data.find((x) => x.id === questionId);

  const back = () => navigate({ to: "/admin/banks/$bankId/questions", params: { bankId } });

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/banks/$bankId/questions"
          params={{ bankId }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to questions
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Edit question</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{bank?.name ?? "Question bank"}</p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Loading question…
        </div>
      ) : !q ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">Question not found.</p>
        </div>
      ) : (
        <QuestionForm
          mode="edit"
          lockBank
          banks={banks ?? []}
          uploadImage={questionsApi.uploadImage}
          submitting={update.isPending}
          initial={toFormValues(q)}
          onCancel={back}
          onSubmit={(v) => {
            update.mutate(
              { id: q.id, input: v },
              {
                onSuccess: () => {
                  toast.success("Question updated");
                  back();
                },
                onError: (err) =>
                  toast.error(err instanceof Error ? err.message : "Could not update question"),
              },
            );
          }}
        />
      )}
    </div>
  );
}
