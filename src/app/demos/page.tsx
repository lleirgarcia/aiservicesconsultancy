import { redirect } from "next/navigation";

/* Las demos son los agentes de la plataforma: no hace falta un índice intermedio. */
export default function DemosIndexPage() {
  redirect("/demos/agentes");
}
