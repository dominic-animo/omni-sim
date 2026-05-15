import { useEffect, useId, useState, type ReactNode } from "react";
import { HelpCircle, X, type LucideIcon } from "lucide-react";

type ExplanationSection = {
  title: string;
  body: ReactNode;
};

export function ExplanationButton({
  title,
  eyebrow,
  sections,
  buttonLabel = "Explain",
  icon: Icon = HelpCircle,
}: {
  title: string;
  eyebrow: string;
  sections: ExplanationSection[];
  buttonLabel?: string;
  icon?: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        <Icon size={18} />
        <span>{buttonLabel}</span>
      </button>

      {open ? (
        <div
          className="explanationOverlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="explanationModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="explanationHeader">
              <div>
                <span className="eyebrow">{eyebrow}</span>
                <h3 id={titleId}>{title}</h3>
              </div>
              <button type="button" aria-label="Close explanation" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </header>

            <div className="explanationBody">
              {sections.map((section) => (
                <article key={section.title} className="explanationSection">
                  <h4>{section.title}</h4>
                  <div>{section.body}</div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
