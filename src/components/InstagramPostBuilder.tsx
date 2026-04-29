"use client";

import { useState, useCallback } from "react";
import { useTemplateBuilder } from "@/hooks/useTemplateBuilder";
import { useTemplateStorage } from "@/hooks/useTemplateStorage";
import { Template, TemplateElement } from "@/types/instagram-builder";
import { generateElementId } from "@/utils/canvasUtils";
import { exportCanvasToBlob } from "@/services/canvasRenderer";
import { useTranslations } from "@/i18n/useTranslations";

// Components
import { TemplateCanvas } from "@/components/Canvas/TemplateCanvas";
import { ElementDragger } from "@/components/Canvas/ElementDragger";
import { Preview } from "@/components/Canvas/Preview";
import { ColorPicker } from "@/components/Sidebar/ColorPicker";
import { ElementPalette } from "@/components/Sidebar/ElementPalette";
import { TextElementEditor } from "@/components/TextElementEditor";
import { DesignEditor } from "@/components/DesignEditor";
import { SaveTemplateModal } from "@/components/SaveTemplateModal";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { ExportModal } from "@/components/ExportModal";

export function InstagramPostBuilder() {
  const t = useTranslations();
  const builder = useTemplateBuilder();
  const storage = useTemplateStorage();

  // UI State
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");
  const [isEditingElement, setIsEditingElement] = useState(false);
  const [isEditingDesign, setIsEditingDesign] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleAddText = useCallback(
    (elementId: string) => {
      const newElement: TemplateElement = {
        id: elementId,
        type: "text",
        position: { x: 100, y: 100 },
        size: { width: 880, height: 200 },
        content: {
          text: "Edit me",
          font_family: "Space Grotesk",
          font_size: 48,
          font_weight: 700,
          color: "#89ceff",
          text_align: "center",
          line_height: 1.2,
        },
        z_index: builder.config.elements.length + 1,
      };
      builder.addElement(newElement);
    },
    [builder]
  );

  const handleElementDrop = useCallback(
    (elementId: string, x: number, y: number) => {
      builder.updateElement(elementId, {
        position: { x: Math.max(0, x - 50), y: Math.max(0, y - 50) },
      });
    },
    [builder]
  );

  const handleSaveTemplate = useCallback(
    async (name: string, description?: string) => {
      const userId = "user-placeholder";
      const result = await storage.createTemplate(userId, name, builder.config, description);
      if (result) {
        builder.resetToDirty();
        setShowSaveModal(false);
      }
    },
    [builder, storage]
  );

  const handleLoadTemplate = useCallback(
    (template: Template) => {
      builder.setConfig(template.config);
      setActiveTab("create");
    },
    [builder]
  );

  const handleDownloadImage = useCallback(
    async (format: "png" | "jpeg") => {
      if (!canvasRef) return;

      try {
        const quality = format === "jpeg" ? 0.95 : undefined;
        const blob = await exportCanvasToBlob(canvasRef, format, quality);
        const filename = `instagram-post-${Date.now()}.${format === "jpeg" ? "jpg" : "png"}`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setShowExportModal(false);
        setExportError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to export image";
        setExportError(message);
      }
    },
    [canvasRef]
  );

  const handleSaveDesignChanges = useCallback(async () => {
    // Save design changes to Supabase
    // Note: This requires a template ID which would come from loading a template
    // For now, we close the design editor. Full save integration requires template loading flow.
    setIsEditingDesign(false);
  }, []);

  const selectedElement = builder.getSelectedElement();

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">
            {t("instagram_builder.pageTitle")}
          </h1>
          <p className="text-[var(--muted)]">Create branded Instagram templates with drag-and-drop</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "create"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "library"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            {t("instagram_builder.labels.myTemplates")}
          </button>
        </div>

        {/* Library Tab */}
        {activeTab === "library" && (
          <div className="mb-8">
            <TemplateLibrary userId="user-placeholder" onSelectTemplate={handleLoadTemplate} />
          </div>
        )}

        {/* Create Tab */}
        {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main canvas area */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Canvas */}
            <ElementDragger config={builder.config} onElementDrop={handleElementDrop}>
              <TemplateCanvas config={builder.config} onCanvasReady={setCanvasRef} />
            </ElementDragger>

            {/* Edit panel */}
            {isEditingElement && selectedElement && (
              <TextElementEditor
                content={selectedElement.content || { text: "", font_family: "Inter", font_size: 24, font_weight: 400, color: "#e0e3e5", text_align: "left" }}
                onChange={(updates) => builder.updateElement(selectedElement.id, { content: { ...selectedElement.content, ...updates } })}
                onDone={() => setIsEditingElement(false)}
              />
            )}

            {/* Design editor panel */}
            {isEditingDesign && selectedElement && (
              <>
                <DesignEditor
                  element={selectedElement}
                  onChange={(updates) => builder.updateElement(selectedElement.id, updates)}
                  onMoveForward={() => builder.moveElementForward(selectedElement.id)}
                  onMoveBackward={() => builder.moveElementBackward(selectedElement.id)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveDesignChanges}
                    className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:opacity-90 transition-opacity"
                  >
                    {t("instagram_builder.buttons.save")}
                  </button>
                  <button
                    onClick={() => setIsEditingDesign(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--fg)] font-medium hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    {t("instagram_builder.buttons.cancel")}
                  </button>
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:opacity-90 transition-opacity"
              >
                {t("instagram_builder.buttons.save")}
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex-1 px-4 py-3 rounded-lg border border-[var(--accent)] text-[var(--accent)] font-medium hover:bg-[var(--accent-dim)] transition-colors"
              >
                {t("instagram_builder.buttons.download")}
              </button>
            </div>
          </div>
        )}

          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Preview */}
            <Preview config={builder.config} label="Live Preview" />

            {/* Element palette */}
            <ElementPalette onAddText={handleAddText} />

            {/* Background color */}
            <ColorPicker
              value={builder.config.canvas.background_color}
              onChange={(color) => builder.setBackgroundColor(color)}
              label={t("instagram_builder.labels.background")}
            />

            {/* Selected element controls */}
            {selectedElement && (
              <div className="p-4 bg-[var(--bg-section)] rounded-lg border border-[var(--border)]">
                <p className="text-sm text-[var(--muted)] mb-2">Selected Element</p>
                <button
                  onClick={() => setIsEditingElement(!isEditingElement)}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] text-sm font-medium hover:opacity-90"
                >
                  {isEditingElement ? "Close Editor" : t("instagram_builder.buttons.edit")}
                </button>
                <button
                  onClick={() => setIsEditingDesign(!isEditingDesign)}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--fg)] text-sm font-medium hover:bg-[var(--border)]"
                >
                  {isEditingDesign ? "Close Design" : t("instagram_builder.buttons.editDesign")}
                </button>
                <button
                  onClick={() => builder.deleteElement(selectedElement.id)}
                  className="w-full px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 border border-red-500/30"
                >
                  {t("instagram_builder.buttons.delete")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        isLoading={storage.isLoading}
        error={storage.error}
        onSave={handleSaveTemplate}
        onCancel={() => setShowSaveModal(false)}
      />

      {/* Export modal */}
      <ExportModal
        isOpen={showExportModal}
        isLoading={false}
        error={exportError}
        onExport={handleDownloadImage}
        onCancel={() => {
          setShowExportModal(false);
          setExportError(null);
        }}
      />
    </div>
  );
}
