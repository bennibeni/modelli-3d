import ModelViewer from "@/components/modelli/ModelViewer";

export default function HomePage() {
  return (
    <div className="app-shell">
      <main id="contenuto" className="app-main">
        <ModelViewer />
      </main>
      <footer className="projects-footer">
        <a href="https://links-page-bennibeni.vercel.app/">
          <span aria-hidden="true">← </span>All projects
        </a>
      </footer>
    </div>
  );
}
