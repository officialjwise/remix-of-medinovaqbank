import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { QuestionForm, emptyQuestion } from "@/components/admin/QuestionForm";
import { questionsApi, useCreateQuestion, useQuestionBanksLite } from "@/api/questions.api";

export const Route = createFileRoute("/admin/banks/$bankId/questions/new")({
  beforeLoad: () => requirePermission("questions.create"),
  head: () => ({
    meta: [
      { title: "Admin · New Question — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewQuestionPage,
});

function NewQuestionPage() {
  const { bankId } = Route.useParams();
  const navigate = useNavigate();
  const { data: banks } = useQuestionBanksLite();
  const bank = banks?.find((b) => b.id === bankId);
  const create = useCreateQuestion();

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
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Add a new question
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{bank?.name ?? "Question bank"}</p>
      </div>

      <QuestionForm
        mode="create"
        lockBank
        banks={banks ?? []}
        uploadImage={questionsApi.uploadImage}
        submitting={create.isPending}
        initial={emptyQuestion(bankId)}
        onCancel={() => navigate({ to: "/admin/banks/$bankId/questions", params: { bankId } })}
        onSubmit={(v) => {
          create.mutate(v, {
            onSuccess: () => {
              toast.success("Question published");
              navigate({ to: "/admin/banks/$bankId/questions", params: { bankId } });
            },
            onError: (err) =>
              toast.error(err instanceof Error ? err.message : "Could not create question"),
          });
        }}
      />
    </div>
  );
}
