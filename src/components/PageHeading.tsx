import { ReactNode } from "react";

type PageHeadingProps = {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { label: string; onClick: () => void };
};

export function PageHeading({ kicker, title, description, actions, back }: PageHeadingProps) {
  return (
    <header className="page-heading">
      <div className="page-heading-main">
        {back ? (
          <button type="button" className="page-back" onClick={back.onClick}>
            <span aria-hidden="true">←</span>
            {back.label}
          </button>
        ) : null}
        {kicker ? <p className="page-kicker">{kicker}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-desc">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
