import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  // La consulta se ejecuta en el servidor; la conexión nunca se expone al navegador.
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main style={{ maxWidth: 850, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>Gestor de proyectos</h1>
      <p>Panel inicial conectado a PostgreSQL mediante Prisma ORM.</p>
      <ul>
        {projects.map(project => (
          <li key={project.id}>
            <strong>{project.name}</strong> — {project.status}
            <p>{project.description}</p>
          </li>
        ))}
      </ul>
      {!projects.length && <p>Todavía no hay proyectos. Creá uno mediante POST /api/projects.</p>}
    </main>
  );
}
