"use client";

import { useState, useCallback } from "react";
import { useTemplateBuilder } from "@/hooks/useTemplateBuilder";
import { useTemplateStorage } from "@/hooks/useTemplateStorage";
import { useToast } from "@/hooks/useToast";
import { Template, TemplateElement, TemplateConfig } from "@/types/instagram-builder";
import { generateElementId } from "@/utils/canvasUtils";
import { exportCanvasToBlob } from "@/services/canvasRenderer";
import { useTranslations } from "@/i18n/useTranslations";

// Components
import { TemplateCanvas } from "@/components/Canvas/TemplateCanvas";
import { Preview } from "@/components/Canvas/Preview";
import { ColorPicker } from "@/components/Sidebar/ColorPicker";
import { ElementPalette } from "@/components/Sidebar/ElementPalette";
import { TextElementEditor } from "@/components/TextElementEditor";
import { InlineTextEditor } from "@/components/InlineTextEditor";
import { DesignEditor } from "@/components/DesignEditor";
import { SaveTemplateModal } from "@/components/SaveTemplateModal";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { ExportModal } from "@/components/ExportModal";
import { ExportTemplateModal } from "@/components/ExportTemplateModal";
import { ImportTemplateModal } from "@/components/ImportTemplateModal";
import { Toast } from "@/components/Toast";

export function InstagramPostBuilder() {
  const t = useTranslations();
  const builder = useTemplateBuilder();
  const storage = useTemplateStorage();
  const { toasts, success, error, removeToast } = useToast();

  // UI State
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");
  const [isEditingElement, setIsEditingElement] = useState(false);
  const [isEditingDesign, setIsEditingDesign] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportTemplateModal, setShowExportTemplateModal] = useState(false);
  const [showImportTemplateModal, setShowImportTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleAddText = useCallback(
    (elementId: string) => {
      const newElement: TemplateElement = {
        id: elementId,
        type: "text",
        position: { x: 400, y: 490 },
        size: { width: 280, height: 100 },
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
      try {
        const userId = "user-placeholder";
        const result = await storage.createTemplate(userId, name, builder.config, description);
        if (result) {
          builder.resetToDirty();
          setShowSaveModal(false);
          success(`Template "${name}" saved successfully`);
        }
      } catch (err) {
        error(err instanceof Error ? err.message : "Failed to save template");
      }
    },
    [builder, storage, success, error]
  );

  const handleLoadTemplate = useCallback(
    (template: Template) => {
      try {
        builder.setConfig(template.config);
        setActiveTab("create");
        success(`Template "${template.name}" loaded`);
      } catch (err) {
        error(err instanceof Error ? err.message : "Failed to load template");
      }
    },
    [builder, success, error]
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
        success(`Image downloaded as ${filename}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to export image";
        setExportError(message);
        error(message);
      }
    },
    [canvasRef, success, error]
  );

  const handleSaveDesignChanges = useCallback(async () => {
    // Save design changes to Supabase
    // Note: This requires a template ID which would come from loading a template
    // For now, we close the design editor. Full save integration requires template loading flow.
    setIsEditingDesign(false);
  }, []);

  const handleExportTemplate = useCallback(async () => {
    try {
      const template = {
        name: "template",
        description: "Exported template",
        config: builder.config,
        id: "temp-" + Date.now(),
        user_id: "user-placeholder",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(template.config, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `template-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowExportTemplateModal(false);
      success("Template exported successfully");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to export template");
    }
  }, [builder.config, success, error]);

  const handleImportTemplate = useCallback(
    async (name: string, config: TemplateConfig) => {
      try {
        await storage.createTemplate("user-placeholder", name, config, "Imported template");
        setShowImportTemplateModal(false);
        setActiveTab("library");
        success(`Template "${name}" imported successfully`);
      } catch (err) {
        error(err instanceof Error ? err.message : "Failed to import template");
      }
    },
    [storage, success, error]
  );

  const handleShowExportTemplateModal = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setShowExportTemplateModal(true);
  }, []);

  const selectedElement = builder.getSelectedElement();

  const getElementAtPoint = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const scaleX = 1080 / rect.width;
      const scaleY = 1080 / rect.height;

      const scaledX = (clientX - rect.left) * scaleX;
      const scaledY = (clientY - rect.top) * scaleY;

      // Check elements in reverse order (top-most first by z-index)
      const sortedElements = [...builder.config.elements].sort(
        (a, b) => b.z_index - a.z_index
      );

      for (const el of sortedElements) {
        if (
          scaledX >= el.position.x &&
          scaledX <= el.position.x + el.size.width &&
          scaledY >= el.position.y &&
          scaledY <= el.position.y + el.size.height
        ) {
          return el;
        }
      }

      // Fallback: find closest element if nothing was hit directly
      let closest = null;
      let minDistance = 200;

      for (const el of sortedElements) {
        const centerX = el.position.x + el.size.width / 2;
        const centerY = el.position.y + el.size.height / 2;
        const distance = Math.sqrt(
          Math.pow(scaledX - centerX, 2) + Math.pow(scaledY - centerY, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          closest = el;
        }
      }

      return closest;
    },
    [builder.config.elements]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = e.currentTarget as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      setCanvasRect(rect);

      const scaleX = 1080 / rect.width;
      const scaleY = 1080 / rect.height;
      const scaledX = (e.clientX - rect.left) * scaleX;
      const scaledY = (e.clientY - rect.top) * scaleY;

      const element = getElementAtPoint(e.clientX, e.clientY, rect);

      if (!element) {
        builder.setSelectedElementId(null);
        return;
      }

      builder.setSelectedElementId(element.id);

      setIsDraggingElement(true);
      setDragOffset({
        x: scaledX - element.position.x,
        y: scaledY - element.position.y,
      });

      e.preventDefault();
    },
    [getElementAtPoint, builder]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingElement || !builder.selectedElementId) return;

      const canvas = e.currentTarget as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      const scaleX = 1080 / rect.width;
      const scaleY = 1080 / rect.height;

      const scaledX = (e.clientX - rect.left) * scaleX;
      const scaledY = (e.clientY - rect.top) * scaleY;

      const currentX = scaledX - dragOffset.x;
      const currentY = scaledY - dragOffset.y;

      const selectedEl = builder.config.elements.find(
        (el) => el.id === builder.selectedElementId
      );

      const elWidth = selectedEl?.size.width || 100;
      const elHeight = selectedEl?.size.height || 100;

      const clampedX = Math.max(0, Math.min(currentX, 1080 - elWidth));
      const clampedY = Math.max(0, Math.min(currentY, 1080 - elHeight));

      builder.updateElement(builder.selectedElementId, {
        position: { x: clampedX, y: clampedY },
      });

      e.preventDefault();
    },
    [isDraggingElement, dragOffset, builder]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingElement(false);
  }, []);

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = e.currentTarget as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const element = getElementAtPoint(e.clientX, e.clientY, rect);

      if (element && element.type === "text") {
        setEditingTextElementId(element.id);
        setIsDraggingElement(false);
      }
    },
    [getElementAtPoint]
  );

  const editingElement = editingTextElementId
    ? builder.config.elements.find((el) => el.id === editingTextElementId)
    : null;

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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--fg)]">
                {t("instagram_builder.labels.myTemplates")}
              </h2>
              <button
                onClick={() => setShowImportTemplateModal(true)}
                className="px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] font-medium hover:bg-[var(--accent-dim)] transition-colors"
              >
                Import
              </button>
            </div>
            <TemplateLibrary
              userId="user-placeholder"
              onSelectTemplate={handleLoadTemplate}
              onExportTemplate={handleShowExportTemplateModal}
            />
          </div>
        )}

        {/* Create Tab */}
        {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main canvas area */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Canvas */}
            <div className="relative">
              <TemplateCanvas
                config={builder.config}
                onCanvasReady={setCanvasRef}
                isDragging={isDraggingElement}
                selectedElementId={builder.selectedElementId}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onDoubleClick={handleCanvasDoubleClick}
              />
              {editingElement && editingElement.content && canvasRef && (
                <InlineTextEditor
                  element={editingElement}
                  canvasRef={canvasRef}
                  onChange={(text) =>
                    builder.updateElement(editingElement.id, {
                      content: { ...editingElement.content!, text },
                    })
                  }
                  onClose={() => setEditingTextElementId(null)}
                />
              )}
            </div>

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
        )}
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

      {/* Export template modal */}
      <ExportTemplateModal
        isOpen={showExportTemplateModal}
        template={selectedTemplate}
        onExport={handleExportTemplate}
        onCancel={() => setShowExportTemplateModal(false)}
      />

      {/* Import template modal */}
      <ImportTemplateModal
        isOpen={showImportTemplateModal}
        error={storage.error}
        onImport={handleImportTemplate}
        onCancel={() => setShowImportTemplateModal(false)}
      />

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-40 max-w-md">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
