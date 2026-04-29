// Type-safe wrapper around Supabase template operations
// Used by components to persist and retrieve templates

import { Template, TemplateConfig } from "@/types/instagram-builder";

export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateError";
  }
}

// These functions are designed to be called from hooks (useTemplateStorage)
// This file provides the type definitions and error handling interface

export interface ITemplateService {
  createTemplate(
    userId: string,
    name: string,
    config: TemplateConfig,
    description?: string
  ): Promise<Template>;

  loadTemplate(templateId: string): Promise<Template>;

  listTemplates(userId: string): Promise<Template[]>;

  updateTemplate(
    templateId: string,
    updates: Partial<{
      name: string;
      description: string;
      config: TemplateConfig;
    }>
  ): Promise<Template>;

  deleteTemplate(templateId: string): Promise<void>;
}

// Export types for use in components
export type { Template, TemplateConfig } from "@/types/instagram-builder";
