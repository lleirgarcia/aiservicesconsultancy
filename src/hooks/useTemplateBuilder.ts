"use client";

import { useState, useCallback } from "react";
import { TemplateConfig, TemplateElement, TextElementContent } from "@/types/instagram-builder";
import { STITCH_PALETTE } from "@/services/designTokens";

const DEFAULT_CONFIG: TemplateConfig = {
  canvas: {
    width: 1080,
    height: 1080,
    background_color: STITCH_PALETTE.bg,
  },
  elements: [],
};

export function useTemplateBuilder(initialConfig?: TemplateConfig) {
  const [config, setConfig] = useState<TemplateConfig>(initialConfig || DEFAULT_CONFIG);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const getSelectedElement = useCallback(
    () => config.elements.find((el) => el.id === selectedElementId) || null,
    [config.elements, selectedElementId]
  );

  const addElement = useCallback(
    (element: TemplateElement) => {
      setConfig((prev) => ({
        ...prev,
        elements: [...prev.elements, element],
      }));
      setIsDirty(true);
      setSelectedElementId(element.id);
    },
    []
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<TemplateElement>) => {
      setConfig((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      }));
      setIsDirty(true);
    },
    []
  );

  const deleteElement = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    setIsDirty(true);
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const setBackgroundColor = useCallback((color: string) => {
    setConfig((prev) => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        background_color: color,
      },
    }));
    setIsDirty(true);
  }, []);

  const moveElementForward = useCallback((id: string) => {
    setConfig((prev) => {
      const element = prev.elements.find((el) => el.id === id);
      if (!element) return prev;

      const maxZIndex = Math.max(...prev.elements.map((el) => el.z_index), 0);
      return {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, z_index: maxZIndex + 1 } : el
        ),
      };
    });
    setIsDirty(true);
  }, []);

  const moveElementBackward = useCallback((id: string) => {
    setConfig((prev) => {
      const element = prev.elements.find((el) => el.id === id);
      if (!element || element.z_index === 0) return prev;

      const elementsWithSameZIndex = prev.elements.filter(
        (el) => el.z_index === element.z_index - 1
      );

      if (elementsWithSameZIndex.length > 0) {
        const minZIndex = Math.min(
          ...prev.elements.map((el) => el.z_index),
          0
        );
        return {
          ...prev,
          elements: prev.elements.map((el) => {
            if (el.id === id) return { ...el, z_index: minZIndex - 1 };
            return el;
          }),
        };
      }

      return {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, z_index: element.z_index - 1 } : el
        ),
      };
    });
    setIsDirty(true);
  }, []);

  const resetToDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setSelectedElementId(null);
    setIsDirty(false);
  }, []);

  return {
    config,
    setConfig,
    selectedElementId,
    setSelectedElementId,
    isDirty,
    resetToDirty,
    getSelectedElement,
    addElement,
    updateElement,
    deleteElement,
    setBackgroundColor,
    moveElementForward,
    moveElementBackward,
    reset,
  };
}
