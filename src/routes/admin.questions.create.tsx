import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { QuestionForm, emptyQuestion } from "@/components/admin/QuestionForm";
import { questionsApi, useCreateQuestion, useQuestionBanksLite } from "@/api/questions.api";

export const Route = createFileRoute("/admin/questions/create")({
  beforeLoad: () => requirePermission("questions.create"),
  validateSearch: (search: Record<string, unknown>) => ({
    bankId: typeof search.bankId === "string" ? search.bankId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Admin · Create Question — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateQuestion,
});

function CreateQuestion() {
  const navigate = useNavigate();
  const { bankId } = Route.useSearch();
  const { data: banks } = useQuestionBanksLite();
  const create = useCreateQuestion();

  const lockBank = !!bankId && (banks ?? []).some((b) => b.id === bankId);
  const startBankId = lockBank ? bankId! : "";

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Questions
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Create Question</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {lockBank
            ? (banks ?? []).find((b) => b.id === bankId)?.name
            : "Choose a bank and author a new question."}
        </p>
      </div>

      <QuestionForm
        mode="create"
        lockBank={lockBank}
        banks={banks ?? []}
        uploadImage={questionsApi.uploadImage}
        submitting={create.isPending}
        initial={emptyQuestion(startBankId)}
        onCancel={() => navigate({ to: "/admin/questions" })}
        onSubmit={(v) => {
          create.mutate(v, {
            onSuccess: () => {
              toast.success("Question published");
              navigate({
                to: "/admin/banks/$bankId/questions",
                params: { bankId: v.bankId },
              });
            },
            onError: (err) =>
              toast.error(err instanceof Error ? err.message : "Could not create question"),
          });
        }}
      />
    </div>
  );
}
