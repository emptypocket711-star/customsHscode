import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

export type ServiceRequestFlowStep = {
  detail: string;
  href?: string;
  label: string;
};

export function ServiceRequestFlowPanel({
  background = "white",
  badge,
  description,
  footer,
  steps,
  title
}: {
  background?: "muted" | "white";
  badge: string;
  description: string;
  footer?: ReactNode;
  steps: ReadonlyArray<ServiceRequestFlowStep>;
  title: string;
}) {
  const wrapperClassName = background === "muted"
    ? "rounded-md border border-slate-200 bg-slate-50 p-3"
    : "rounded-md border border-slate-200 bg-white p-4";
  const stepClassName = background === "muted"
    ? "focus-ring rounded-md bg-white p-3 hover:bg-blue-50"
    : "focus-ring rounded-md bg-slate-50 p-3 hover:bg-blue-50";

  return (
    <div className={wrapperClassName}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">{description}</p>
        </div>
        <Badge tone="info">{badge}</Badge>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {steps.map((step) => {
          const content = (
            <>
              <p className="text-xs font-semibold text-slate-950">{step.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{step.detail}</p>
            </>
          );

          return step.href ? (
            <a className={stepClassName} href={step.href} key={step.label}>
              {content}
            </a>
          ) : (
            <div className={stepClassName} key={step.label}>
              {content}
            </div>
          );
        })}
      </div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
