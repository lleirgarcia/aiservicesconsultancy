import { AREAS, type AreaId } from "@/lib/constants";

interface Props {
  selected: AreaId | null;
  onSelect: (area: AreaId) => void;
}

export default function AreaSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: "var(--muted)" }}>
        Selecciona un área
      </p>
      <div className="flex flex-wrap gap-2">
        {AREAS.map((area) => {
          const isActive = selected === area.id;
          return (
            <button
              key={area.id}
              onClick={() => onSelect(area.id)}
              className="text-sm px-4 py-2 rounded-full border cursor-pointer transition-all"
              style={{
                borderColor: isActive ? "var(--fg)" : "var(--border)",
                background: isActive ? "var(--fg)" : "transparent",
                color: isActive ? "#fff" : "var(--fg)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {area.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
