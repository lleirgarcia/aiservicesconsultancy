interface WindowProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  statusText?: string;
  menuItems?: string[];
  className?: string;
}

export default function Window({
  title,
  icon,
  children,
  statusText,
  menuItems,
  className = "",
}: WindowProps) {
  return (
    <div className={`w95-window ${className}`}>
      {/* Barra de título */}
      <div className="w95-titlebar">
        <span className="w95-titlebar-title">
          {icon && <span>{icon}</span>}
          {title}
        </span>
        <div className="w95-titlebar-btns">
          <button className="w95-titlebar-btn" aria-hidden>_</button>
          <button className="w95-titlebar-btn" aria-hidden>□</button>
          <button className="w95-titlebar-btn" aria-hidden>✕</button>
        </div>
      </div>

      {/* Barra de menú opcional */}
      {menuItems && menuItems.length > 0 && (
        <div className="w95-menubar">
          {menuItems.map((item) => (
            <span key={item} className="w95-menubar-item">{item}</span>
          ))}
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 md:p-6">
        {children}
      </div>

      {/* Barra de estado opcional */}
      {statusText && (
        <div className="w95-statusbar">
          <span className="w95-statusbar-panel">{statusText}</span>
          <span className="w95-statusbar-panel" style={{ maxWidth: "120px" }}>
            Osona, Barcelona
          </span>
        </div>
      )}
    </div>
  );
}
