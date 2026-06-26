import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { QuestionForm, emptyQuestion } from "@/components/admin/QuestionForm";

export const Route = createFileRoute("/admin/questions/create")({
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
  const lockBank = !!bankId && questionBanks.some((b) => b.id === bankId);
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
            ? questionBanks.find((b) => b.id === bankId)?.name
            : "Choose a bank and author a new question."}
        </p>
      </div>

      <QuestionForm
        mode="create"
        lockBank={lockBank}
        initial={emptyQuestion(startBankId)}
        onCancel={() => navigate({ to: "/admin/questions" })}
        onSubmit={(v, publish) => {
          toast.success(publish ? "Question published" : "Draft saved");
          navigate({ to: "/admin/banks/$bankId/questions", params: { bankId: v.bankId } });
        }}
      />
    </div>
  );
}
