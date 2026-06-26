import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { QuestionForm, emptyQuestion } from "@/components/admin/QuestionForm";

export const Route = createFileRoute("/admin/banks/$bankId/questions/new")({
  head: () => ({ meta: [{ title: "Admin · New Question — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: NewQuestionPage,
});

function NewQuestionPage() {
  const { bankId } = Route.useParams();
  const navigate = useNavigate();
  const bank = questionBanks.find((b) => b.id === bankId);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/banks/$bankId/questions" params={{ bankId }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to questions
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Add a new question</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{bank?.name ?? "Question bank"}</p>
      </div>

      <QuestionForm
        mode="create"
        lockBank
        initial={emptyQuestion(bankId)}
        onCancel={() => navigate({ to: "/admin/banks/$bankId/questions", params: { bankId } })}
        onSubmit={(_v, publish) => {
          toast.success(publish ? "Question published" : "Draft saved");
          navigate({ to: "/admin/banks/$bankId/questions", params: { bankId } });
        }}
      />
    </div>
  );
}
