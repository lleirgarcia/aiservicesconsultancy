"use client";

import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Template, TemplateConfig } from "@/types/instagram-builder";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export function useTemplateStorage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTemplate = useCallback(
    async (
      userId: string,
      name: string,
      config: TemplateConfig,
      description?: string
    ): Promise<Template | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from("templates")
          .insert([
            {
              user_id: userId,
              name,
              config,
              description,
              format: "1080x1080",
            },
          ])
          .select()
          .single();

        if (dbError) throw dbError;
        return data as Template;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save template";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadTemplate = useCallback(async (templateId: string): Promise<Template | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (dbError) throw dbError;
      return data as Template;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load template";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listTemplates = useCallback(async (userId: string): Promise<Template[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (dbError) throw dbError;
      return (data || []) as Template[];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load templates";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(
    async (
      templateId: string,
      updates: Partial<{
        name: string;
        description: string;
        config: TemplateConfig;
      }>
    ): Promise<Template | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from("templates")
          .update(updates)
          .eq("id", templateId)
          .select()
          .single();

        if (dbError) throw dbError;
        return data as Template;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update template";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase.from("templates").delete().eq("id", templateId);

      if (dbError) throw dbError;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete template";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createTemplate,
    loadTemplate,
    listTemplates,
    updateTemplate,
    deleteTemplate,
  };
}
