import { FormEvent, useState } from "react";
import { useApp } from "../../app/store";
import { Link } from "../../app/router";
import { useToast } from "../../components/ToastProvider";
import { EmptyState } from "../../components/EmptyState";
import { PageHeading } from "../../components/PageHeading";
import { GroupPanel } from "../../components/GroupPanel";
import { Split } from "../../components/Split";
import { Project } from "../../domain/types";
import { tileHex } from "../../domain/appearance";
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
      <PageHeading
        kicker={data.projects.length === 1 ? "1 project" : `${data.projects.length} projects`}
        title="Projects"
        description="Simple labels to group related tasks."
      />
      <Split
        side={
          <div className="side-card panel">
            <span className="field-label">New project</span>
            <form className="side-form" onSubmit={handleSubmit} noValidate>
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
              <button type="submit" className="btn btn-primary">
                Create
              </button>
            </form>
            {nameError !== null ? (
              <p id="project-name-error" className="field-error" role="alert">
                {nameError}
              </p>
            ) : null}
            <Link to="/unassigned" className="side-link">
              <span>No project</span>
              <span className="group-count">{unassignedCount}</span>
            </Link>
          </div>
        }
      >
        {data.projects.length === 0 ? (
          <EmptyState kicker="Optional" title="No projects yet.">
            <p className="muted small">
              Create one in the panel, or leave tasks unassigned — that’s always allowed.
            </p>
          </EmptyState>
        ) : (
          <div className="groups">
            <GroupPanel title="Your projects">
              {data.projects.map((project) => (
                <ProjectItem key={project.id} project={project} />
              ))}
            </GroupPanel>
          </div>
        )}
      </Split>
    </>
  );
}

function ProjectItem({ project }: { project: Project }) {
  const { data } = useApp();
  const count = data.tasks.filter((task) => task.projectId === project.id).length;
  const hex = tileHex(project.color);
  return (
    <li className="row row-link">
      <Link to={`/projects/${project.id}`} className="row-body">
        <span
          className="tile"
          aria-hidden="true"
          style={hex ? ({ "--tile": hex } as React.CSSProperties) : undefined}
        >
          {project.emoji ?? project.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="row-title">{project.name}</span>
        <span className="group-count">{count === 1 ? "1 task" : `${count} tasks`}</span>
        <ChevronRight size={16} />
      </Link>
    </li>
  );
}
