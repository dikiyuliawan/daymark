import { FormEvent, useState } from "react";
import { useApp } from "../../app/store";
import { Link } from "../../app/router";
import { useToast } from "../../components/ToastProvider";
import { EmptyState } from "../../components/EmptyState";
import { Project } from "../../domain/types";

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

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-desc">Simple labels to group related tasks.</p>
        </div>
      </div>
      <form className="project-create" onSubmit={handleSubmit} noValidate>
        <label className="filter">
          <span className="filter-label">New project</span>
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError !== null) {
                setNameError(null);
              }
            }}
            aria-invalid={nameError !== null}
            aria-describedby={nameError !== null ? "project-name-error" : undefined}
            placeholder="e.g. Rewrite auth flow"
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Create project
        </button>
      </form>
      {nameError !== null ? (
        <p id="project-name-error" className="field-error" role="alert">
          {nameError}
        </p>
      ) : null}
      <Link to="/unassigned" className="project-unassigned-link">
        Tasks with no project ({data.tasks.filter((t) => t.projectId === null).length})
      </Link>
      {data.projects.length === 0 ? (
        <EmptyState title="No projects yet.">
          <p className="empty-hint">
            Create one above, or leave tasks unassigned — that's always allowed.
          </p>
        </EmptyState>
      ) : (
        <ul className="project-list">
          {data.projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </ul>
      )}
    </>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const { data } = useApp();
  const count = data.tasks.filter((task) => task.projectId === project.id).length;
  return (
    <li className="project-row">
      <Link to={`/projects/${project.id}`} className="project-link">
        {project.name}
        <span className="project-count">
          {count === 1 ? "1 task" : `${count} tasks`}
        </span>
      </Link>
    </li>
  );
}
