import { useEffect, useState, AnchorHTMLAttributes } from "react";

export type Route =
  | { name: "today" }
  | { name: "tasks" }
  | { name: "projects" }
  | { name: "project"; id: string }
  | { name: "unassigned" }
  | { name: "notFound" };

export function parseHash(hash: string): Route {
  const path = hash.startsWith("#") ? hash.slice(1) : hash;
  const normalized = path.split("?")[0].replace(/\/+$/, "");
  if (normalized === "" || normalized === "/" || normalized === "/today") {
    return { name: "today" };
  }
  if (normalized === "/tasks") {
    return { name: "tasks" };
  }
  if (normalized === "/projects") {
    return { name: "projects" };
  }
  if (normalized === "/unassigned") {
    return { name: "unassigned" };
  }
  const projectMatch = /^\/projects\/([^/]+)$/.exec(normalized);
  if (projectMatch) {
    return { name: "project", id: decodeURIComponent(projectMatch[1]) };
  }
  return { name: "notFound" };
}

export function routePath(route: Route): string {
  switch (route.name) {
    case "today":
      return "#/today";
    case "tasks":
      return "#/tasks";
    case "projects":
      return "#/projects";
    case "project":
      return `#/projects/${encodeURIComponent(route.id)}`;
    case "unassigned":
      return "#/unassigned";
    case "notFound":
      return "#/today";
  }
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return route;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

// A plain anchor keeps native navigation semantics (open in new tab, copy
// link, keyboard activation) — hashchange drives the re-render.
export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  );
}
