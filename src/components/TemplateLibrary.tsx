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
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-[var(--bg-section)] border border-[var(--border)] rounded-lg animate-pulse"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-[var(--bg-elevated)] rounded w-1/3" />
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-2/3" />
                <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/4" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-16 bg-[var(--bg-elevated)] rounded" />
                <div className="h-10 w-16 bg-[var(--bg-elevated)] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
