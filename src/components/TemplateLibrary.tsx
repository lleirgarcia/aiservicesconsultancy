"use client";

import { useEffect, useState } from "react";
import { Template } from "@/types/instagram-builder";
import { TemplateLibraryItem } from "@/components/TemplateLibraryItem";
import { useTemplateStorage } from "@/hooks/useTemplateStorage";

interface TemplateLibraryProps {
  userId: string;
  onSelectTemplate: (template: Template) => void;
  onExportTemplate?: (template: Template) => void;
}

export function TemplateLibrary({
  userId,
  onSelectTemplate,
  onExportTemplate,
}: TemplateLibraryProps) {
  const storage = useTemplateStorage();
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const loadTemplates = async () => {
      const loaded = await storage.listTemplates(userId);
      setTemplates(loaded);
    };
    loadTemplates();
  }, [userId, storage]);

  if (storage.isLoading) {
    return <div className="text-[var(--muted)]">Loading templates...</div>;
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted)]">
        <p>No templates yet. Create your first template!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {templates.map((template) => (
        <TemplateLibraryItem
          key={template.id}
          template={template}
          onSelect={() => onSelectTemplate(template)}
          onExport={onExportTemplate ? () => onExportTemplate(template) : undefined}
          onDelete={async () => {
            await storage.deleteTemplate(template.id);
            setTemplates(templates.filter((t) => t.id !== template.id));
          }}
        />
      ))}
    </div>
  );
}
