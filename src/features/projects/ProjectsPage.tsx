import { FormEvent, useState } from "react";
import { useApp } from "../../app/store";
import { Link } from "../../app/router";
import { useToast } from "../../components/ToastProvider";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Project } from "../../domain/types";
import { tileHex, tileInk } from "../../domain/appearance";
import { ChevronRight } from "../../components/icons";

export function ProjectsPage() {
  const { data, addProject } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") {
      setNameError("Projects need a name.");
      return;
    }
    addProject(trimmed);
    setName("");
    setNameError(null);
    showToast(`Project “${trimmed}” created`);
  };

  const unassignedCount = data.tasks.filter((task) => task.projectId === null).length;

  return (
    <>
      <ScreenHeader
        title="Projects"
        sub={data.projects.length === 1 ? "1 project" : `${data.projects.length} projects`}
      />

      <form className="new-project" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError !== null) setNameError(null);
          }}
          aria-invalid={nameError !== null}
          aria-describedby={nameError !== null ? "project-name-error" : undefined}
          placeholder="New project name"
          aria-label="New project"
        />
        <button type="submit" className="btn btn--primary">
          Create
        </button>
      </form>
      {nameError !== null ? (
        <p id="project-name-error" className="field-error" role="alert">
          {nameError}
        </p>
      ) : null}

      {data.projects.length === 0 ? (
        <EmptyState kicker="Optional" title="No projects yet.">
          <p className="muted small">
            Name one above, or leave tasks unassigned — that’s always allowed.
          </p>
        </EmptyState>
      ) : (
        <div className="groups">
          <ul className="list">
            {data.projects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
            <li className="row row-link">
              <Link to="/unassigned" className="row-body row-link-inner">
                <span className="tile tile-plain" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                </span>
                <span className="row-title">No project</span>
                <span className="row-pill">
                  {unassignedCount === 1 ? "1 task" : `${unassignedCount} tasks`}
                </span>
                <ChevronRight className="row-chevron" size={16} />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

function ProjectItem({ project }: { project: Project }) {
  const { data } = useApp();
  const count = data.tasks.filter((task) => task.projectId === project.id).length;
  const hex = tileHex(project.color);
  return (
    <li className="row row-link">
      <Link to={`/projects/${project.id}`} className="row-body row-link-inner">
        <span
          className="tile"
          aria-hidden="true"
          style={
            hex
              ? ({ "--tile": hex, "--tile-ink": tileInk(project.color) } as React.CSSProperties)
              : undefined
          }
        >
          {project.emoji ?? project.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="row-title">{project.name}</span>
        <span className="row-pill">{count === 1 ? "1 task" : `${count} tasks`}</span>
        <ChevronRight className="row-chevron" size={16} />
      </Link>
    </li>
  );
}
