export type EstadoEntrega = "pendiente" | "en_ruta" | "entregado" | "incidencia";

export interface Entrega {
  id: string;
  numeroAlbaran: string;
  cliente: string;
  direccion: string;
  bultos: number;
  peso: string;
  estado: EstadoEntrega;
  conductor: string;
  horaPrevista: string;
  horaReal?: string;
  firmaName?: string;
  firmaSvgPath?: string;
  notas?: string;
}

export const CONDUCTORES = [
  { id: "c1", nombre: "Jordi Riera", iniciales: "JR" },
  { id: "c2", nombre: "Marta Solé", iniciales: "MS" },
];

export const ENTREGAS_INICIALES: Entrega[] = [
  {
    id: "e1",
    numeroAlbaran: "ALB-2026-04829",
    cliente: "Bistró Mercè",
    direccion: "Carrer Major 18, 08560 Manlleu",
    bultos: 3,
    peso: "24 kg",
    estado: "en_ruta",
    conductor: "Jordi Riera",
    horaPrevista: "10:30",
  },
  {
    id: "e2",
    numeroAlbaran: "ALB-2026-04830",
    cliente: "Restaurant La Plaça",
    direccion: "Plaça Major 7, 08500 Vic",
    bultos: 2,
    peso: "12 kg",
    estado: "pendiente",
    conductor: "Jordi Riera",
    horaPrevista: "11:15",
  },
  {
    id: "e3",
    numeroAlbaran: "ALB-2026-04831",
    cliente: "Forn Pa de Pagès",
    direccion: "Carrer del Pont 4, 08570 Torelló",
    bultos: 5,
    peso: "38 kg",
    estado: "pendiente",
    conductor: "Jordi Riera",
    horaPrevista: "12:00",
  },
  {
    id: "e4",
    numeroAlbaran: "ALB-2026-04832",
    cliente: "Hotel Plaça",
    direccion: "Plaça del Mercadal 12, 08500 Vic",
    bultos: 4,
    peso: "31 kg",
    estado: "pendiente",
    conductor: "Marta Solé",
    horaPrevista: "10:00",
  },
  {
    id: "e5",
    numeroAlbaran: "ALB-2026-04833",
    cliente: "Cervesa & Co.",
    direccion: "Polígon La Riera, 08510 Roda de Ter",
    bultos: 8,
    peso: "65 kg",
    estado: "pendiente",
    conductor: "Marta Solé",
    horaPrevista: "11:00",
  },
];
