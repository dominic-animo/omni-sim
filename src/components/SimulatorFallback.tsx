export function SimulatorFallback() {
  return (
    <>
      <section className="stage">
        <div className="loadingPanel">
          <span className="eyebrow">Loading Module</span>
          <h2>Preparing Simulator</h2>
        </div>
      </section>
      <aside className="controlDock">
        <div className="dockTitle">
          <span>Parameters</span>
        </div>
      </aside>
    </>
  );
}
