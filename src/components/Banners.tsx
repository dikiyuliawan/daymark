import { useApp } from "../app/store";

export function RecoveryBanner() {
  const { load, dismissRecovery, startFresh } = useApp();
  if (load.kind !== "corrupt") {
    return null;
  }
  return (
    <section className="banner banner-error" aria-live="polite">
      <p>
        Daymark could not read the data saved in this browser ({load.reason}). The saved data was
        <strong> not modified</strong>. You can keep going from an empty workspace, or clear the
        unreadable data and start fresh.
      </p>
      <div className="banner-actions">
        <button type="button" className="btn" onClick={dismissRecovery}>
          Continue with an empty workspace
        </button>
        <button type="button" className="btn btn-danger" onClick={startFresh}>
          Clear saved data and start fresh
        </button>
      </div>
    </section>
  );
}

export function SaveErrorBanner() {
  const { saveError, dismissSaveError } = useApp();
  if (!saveError) {
    return null;
  }
  return (
    <section className="banner banner-error" aria-live="assertive">
      <p>{saveError}</p>
      <div className="banner-actions">
        <button type="button" className="btn" onClick={dismissSaveError}>
          Dismiss
        </button>
      </div>
    </section>
  );
}

export function StorageUnavailableBanner() {
  const { load } = useApp();
  if (load.kind !== "unavailable") {
    return null;
  }
  return (
    <section className="banner banner-warn" aria-live="polite">
      <p>
        This browser is blocking storage for Daymark, so changes are not saved when you reload the
        page. Everything works while the tab is open.
      </p>
    </section>
  );
}
