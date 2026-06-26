import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Link2, Underline } from "lucide-react";

/**
 * Lightweight dependency-free rich-text editor built on contentEditable.
 * Emits HTML. Good enough for CMS articles/legal copy without pulling in a
 * heavy editor framework.
 */
export function RichTextEditor({ value, onChange, minHeight = 180 }: { value: string; onChange: (html: string) => void; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value only when it diverges (avoids clobbering the caret).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML ?? "");
  }

  const tools = [
    { icon: Bold, cmd: "bold", label: "Bold" },
    { icon: Italic, cmd: "italic", label: "Italic" },
    { icon: Underline, cmd: "underline", label: "Underline" },
    { icon: Heading2, cmd: "formatBlock", arg: "<h3>", label: "Heading" },
    { icon: List, cmd: "insertUnorderedList", label: "Bullet list" },
    { icon: ListOrdered, cmd: "insertOrderedList", label: "Numbered list" },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-alt/50 px-2 py-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec(t.cmd, t.arg);
            }}
            title={t.label}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <t.icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = window.prompt("Link URL");
            if (url) exec("createLink", url);
          }}
          title="Insert link"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        className="prose prose-sm max-w-none px-3 py-2.5 text-sm text-foreground outline-none [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-accent [&_a]:underline"
        style={{ minHeight }}
      />
    </div>
  );
}
