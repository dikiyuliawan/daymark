import { ReactNode } from "react";

type StatHeroProps = {
  label: string;
  value: number;
  total?: number;
  pill?: ReactNode;
  children?: ReactNode;
};

export function StatHero({ label, value, total, pill, children }: StatHeroProps) {
  return (
    <section className="hero panel">
      <p className="hero-label">{label}</p>
      <p className="hero-num">
        {value}
        {total !== undefined ? <small>/{total}</small> : null}
      </p>
      {pill !== undefined ? <p className="pill">{pill}</p> : null}
      {children}
    </section>
  );
}
