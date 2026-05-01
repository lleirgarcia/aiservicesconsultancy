"use client";

import { useState, useCallback, useEffect, useRef, CSSProperties } from "react";
import { useTemplateBuilder } from "@/hooks/useTemplateBuilder";
import { useTemplateStorage } from "@/hooks/useTemplateStorage";
import { useToast } from "@/hooks/useToast";
import { Template, TemplateElement, TemplateConfig, ShapeConfig } from "@/types/instagram-builder";
import { generateElementId } from "@/utils/canvasUtils";
import { exportCanvasToBlob } from "@/services/canvasRenderer";
import { useTranslations } from "@/i18n/useTranslations";

// Components
import { TemplateCanvas } from "@/components/Canvas/TemplateCanvas";
import { Preview } from "@/components/Canvas/Preview";
import { ColorPicker } from "@/components/Sidebar/ColorPicker";
import { ElementPalette } from "@/components/Sidebar/ElementPalette";
import { FontSelector } from "@/components/Sidebar/FontSelector";
import { TextElementEditor } from "@/components/TextElementEditor";
import { InlineTextEditor } from "@/components/InlineTextEditor";
import { DesignEditor } from "@/components/DesignEditor";
import { SaveTemplateModal } from "@/components/SaveTemplateModal";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { ExportModal } from "@/components/ExportModal";
import { ExportTemplateModal } from "@/components/ExportTemplateModal";
import { ImportTemplateModal } from "@/components/ImportTemplateModal";
import { Toast } from "@/components/Toast";

type ResizeHandle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

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
  const [canvasContainerRef, setCanvasContainerRef] = useState<HTMLDivElement | null>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Resize state
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const resizeStartRef = useRef<{
    mouseX: number; mouseY: number;
    x: number; y: number; w: number; h: number;
    isText: boolean; fontSize: number;
  } | null>(null);

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
        position: { x: x - 50, y: y - 50 },
      });
    },
    [builder]
  );

  const handleElementResize = useCallback(
    (elementId: string, position: { x: number; y: number }, size: { width: number; height: number }) => {
      builder.updateElement(elementId, { position, size });
    },
    [builder]
  );

  const handleTextEdit = useCallback(
    (elementId: string, text: string) => {
      const element = builder.config.elements.find((el) => el.id === elementId);
      if (!element?.content) return;
      builder.updateElement(elementId, { content: { ...element.content, text } });
    },
    [builder]
  );

  const handleAddShape = useCallback(
    (elementId: string, kind: ShapeConfig["type"] | "rounded-rect") => {
      const cx = 540, cy = 540;
      let shape: ShapeConfig;
      let size = { width: 300, height: 300 };

      switch (kind) {
        case "line":
          shape = { type: "line", fill_color: "#45464d" };
          size = { width: 800, height: 4 };
          break;
        case "rectangle":
          shape = { type: "rectangle", fill_color: "#272a2c" };
          size = { width: 400, height: 200 };
          break;
        case "rounded-rect":
          shape = { type: "rectangle", fill_color: "#272a2c", border_radius: 24 };
          size = { width: 400, height: 200 };
          break;
        case "circle":
          shape = { type: "circle", fill_color: "#272a2c" };
          size = { width: 300, height: 300 };
          break;
        case "ellipse":
          shape = { type: "ellipse", fill_color: "#272a2c" };
          size = { width: 400, height: 240 };
          break;
        case "triangle":
          shape = { type: "triangle", fill_color: "#272a2c" };
          break;
        case "diamond":
          shape = { type: "diamond", fill_color: "#272a2c" };
          break;
        case "pentagon":
          shape = { type: "pentagon", fill_color: "#272a2c" };
          break;
        case "hexagon":
          shape = { type: "hexagon", fill_color: "#272a2c" };
          break;
        case "star":
          shape = { type: "star", fill_color: "#89ceff" };
          break;
        case "heart":
          shape = { type: "heart", fill_color: "#ef4444" };
          break;
        case "arrow":
          shape = { type: "arrow", fill_color: "#272a2c" };
          size = { width: 400, height: 160 };
          break;
        default:
          return;
      }

      const newElement: TemplateElement = {
        id: elementId,
        type: "shape",
        position: { x: cx - size.width / 2, y: cy - size.height / 2 },
        size,
        shape,
        z_index: builder.config.elements.length + 1,
      };
      builder.addElement(newElement);
    },
    [builder]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      if (!builder.selectedElementId || !canvasRef) return;
      const el = builder.config.elements.find((el) => el.id === builder.selectedElementId);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      setResizeHandle(handle);
      resizeStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        x: el.position.x,
        y: el.position.y,
        w: el.size.width,
        h: el.size.height,
        isText: el.type === "text",
        fontSize: el.content?.font_size ?? 48,
      };
    },
    [builder, canvasRef]
  );

  useEffect(() => {
    if (!resizeHandle || !builder.selectedElementId) return;

    const onMove = (e: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start || !canvasRef) return;
      const rect = canvasRef.getBoundingClientRect();
      const scaleX = 1080 / rect.width;
      const scaleY = 1080 / rect.height;
      const dx = (e.clientX - start.mouseX) * scaleX;
      const dy = (e.clientY - start.mouseY) * scaleY;

      let newX = start.x, newY = start.y, newW = start.w, newH = start.h;

      if (start.isText) {
        // For text: scale font_size proportionally and keep aspect ratio of the box
        const isCorner = resizeHandle.length === 2;
        const fx = resizeHandle.includes("e")
          ? (start.w + dx) / start.w
          : resizeHandle.includes("w")
            ? (start.w - dx) / start.w
            : 1;
        const fy = resizeHandle.includes("s")
          ? (start.h + dy) / start.h
          : resizeHandle.includes("n")
            ? (start.h - dy) / start.h
            : 1;
        const factor = Math.max(0.1, isCorner ? Math.max(fx, fy) : (fx !== 1 ? fx : fy));

        newW = Math.max(20, start.w * factor);
        newH = Math.max(20, start.h * factor);
        if (resizeHandle.includes("w")) newX = start.x + (start.w - newW);
        if (resizeHandle.includes("n")) newY = start.y + (start.h - newH);

        const newFontSize = Math.max(8, Math.round(start.fontSize * factor));
        const el = builder.config.elements.find((e) => e.id === builder.selectedElementId);
        if (el?.content) {
          builder.updateElement(builder.selectedElementId!, {
            position: { x: newX, y: newY },
            size: { width: newW, height: newH },
            content: { ...el.content, font_size: newFontSize },
          });
        }
        return;
      }

      if (resizeHandle.includes("e")) newW = Math.max(20, start.w + dx);
      if (resizeHandle.includes("s")) newH = Math.max(20, start.h + dy);
      if (resizeHandle.includes("w")) {
        newW = Math.max(20, start.w - dx);
        newX = start.x + (start.w - newW);
      }
      if (resizeHandle.includes("n")) {
        newH = Math.max(20, start.h - dy);
        newY = start.y + (start.h - newH);
      }

      builder.updateElement(builder.selectedElementId!, {
        position: { x: newX, y: newY },
        size: { width: newW, height: newH },
      });
    };

    const onUp = () => {
      setResizeHandle(null);
      resizeStartRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizeHandle, builder, canvasRef]);

  const handleDeleteSelected = useCallback(() => {
    if (!builder.selectedElementId) return;
    builder.deleteElement(builder.selectedElementId);
    setEditingTextElementId(null);
  }, [builder]);

  const clipboardRef = useRef<TemplateElement | null>(null);

  const handleCopySelected = useCallback(() => {
    const el = builder.config.elements.find((e) => e.id === builder.selectedElementId);
    if (!el) return;
    clipboardRef.current = el;
  }, [builder]);

  const handlePasteClipboard = useCallback(() => {
    const src = clipboardRef.current;
    if (!src) return;
    const offset = 30;
    const newElement: TemplateElement = {
      ...src,
      id: generateElementId(),
      position: {
        x: src.position.x + offset,
        y: src.position.y + offset,
      },
      content: src.content ? { ...src.content } : undefined,
      shape: src.shape ? { ...src.shape } : undefined,
      z_index: builder.config.elements.length + 1,
    };
    builder.addElement(newElement);
  }, [builder]);

  const handleDuplicateSelected = useCallback(() => {
    handleCopySelected();
    handlePasteClipboard();
  }, [handleCopySelected, handlePasteClipboard]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (editingTextElementId) return;
      const editable = isEditableTarget(e.target);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && (e.key === "c" || e.key === "C")) {
        if (!builder.selectedElementId) return;
        if (editable) return;
        e.preventDefault();
        handleCopySelected();
        return;
      }
      if (mod && (e.key === "v" || e.key === "V")) {
        if (editable) return;
        if (!clipboardRef.current) return;
        e.preventDefault();
        handlePasteClipboard();
        return;
      }
      if (mod && (e.key === "d" || e.key === "D")) {
        if (!builder.selectedElementId) return;
        if (editable) return;
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!builder.selectedElementId) return;
        if (editable) return;
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    builder.selectedElementId,
    editingTextElementId,
    handleDeleteSelected,
    handleCopySelected,
    handlePasteClipboard,
    handleDuplicateSelected,
  ]);

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

      builder.updateElement(builder.selectedElementId, {
        position: { x: currentX, y: currentY },
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
      <div className="w-full">
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
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main canvas area */}
          <div className="w-full lg:w-[600px] lg:shrink-0 flex flex-col gap-6">
            {/* Canvas */}
            <div className="relative" ref={setCanvasContainerRef}>
              <TemplateCanvas
                config={builder.config}
                onCanvasReady={setCanvasRef}
                isDragging={isDraggingElement}
                selectedElementId={resizeHandle ? null : builder.selectedElementId}
                hiddenElementId={editingTextElementId}
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
                  onChangeFont={(font) =>
                    builder.updateElement(editingElement.id, {
                      content: { ...editingElement.content!, font_family: font },
                    })
                  }
                  onClose={() => setEditingTextElementId(null)}
                />
              )}
              {/* Resize handles overlay */}
              {selectedElement && canvasRef && canvasContainerRef && !editingTextElementId && (() => {
                const cr = canvasRef.getBoundingClientRect();
                const pr = canvasContainerRef.getBoundingClientRect();
                const sx = cr.width / 1080;
                const sy = cr.height / 1080;
                const ox = cr.left - pr.left;
                const oy = cr.top - pr.top;
                const left = selectedElement.position.x * sx + ox;
                const top = selectedElement.position.y * sy + oy;
                const w = selectedElement.size.width * sx;
                const h = selectedElement.size.height * sy;
                const H = 8;
                const half = H / 2;
                const mid = `calc(50% - ${half}px)`;
                const handles: { id: ResizeHandle; style: CSSProperties }[] = [
                  { id: "nw", style: { top: -half, left: -half, cursor: "nw-resize" } },
                  { id: "n",  style: { top: -half, left: mid,    cursor: "n-resize"  } },
                  { id: "ne", style: { top: -half, right: -half, cursor: "ne-resize" } },
                  { id: "w",  style: { top: mid,   left: -half,  cursor: "w-resize"  } },
                  { id: "e",  style: { top: mid,   right: -half, cursor: "e-resize"  } },
                  { id: "sw", style: { bottom: -half, left: -half,  cursor: "sw-resize" } },
                  { id: "s",  style: { bottom: -half, left: mid,    cursor: "s-resize"  } },
                  { id: "se", style: { bottom: -half, right: -half, cursor: "se-resize" } },
                ];
                return (
                  <div style={{ position: "absolute", left, top, width: w, height: h,
                                border: "2px solid #89ceff", boxSizing: "border-box",
                                pointerEvents: "none", zIndex: 10 }}>
                    {handles.map(({ id, style }) => (
                      <div key={id} style={{
                        position: "absolute", width: H, height: H,
                        background: "#fff", border: "2px solid #89ceff",
                        borderRadius: 2, boxSizing: "border-box",
                        pointerEvents: "auto", ...style,
                      }}
                        onMouseDown={(e) => handleResizeMouseDown(e, id)}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Edit panel */}
            {isEditingElement && selectedElement && (
              <TextElementEditor
                content={selectedElement.content || { text: "", font_family: "Inter", font_size: 24, font_weight: 400, color: "#e0e3e5", text_align: "left" }}
                onChange={(updates) => {
                  const base = selectedElement.content ?? { text: "", font_family: "Inter", font_size: 24, font_weight: 400, color: "#e0e3e5", text_align: "left" as const };
                  builder.updateElement(selectedElement.id, { content: { ...base, ...updates } });
                }}
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
          <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col gap-6">
            {/* Preview */}
            <Preview config={builder.config} label="Live Preview" />

            {/* Element palette */}
            <ElementPalette
              onAddText={handleAddText}
              onAddShape={handleAddShape}
            />

            {/* Background color */}
            <ColorPicker
              value={builder.config.canvas.background_color}
              onChange={(color) => builder.setBackgroundColor(color)}
              label={t("instagram_builder.labels.background")}
            />

          </div>

          {/* Selected element panel (right column) */}
          {selectedElement && (
            <div className="w-full lg:w-[320px] lg:shrink-0 flex flex-col gap-6">
              <div className="p-4 bg-[var(--bg-section)] rounded-lg border border-[var(--border)]">
                <p className="text-sm text-[var(--muted)] mb-2">Selected Element</p>
                {selectedElement.type === "text" && selectedElement.content && (
                  <div className="mb-3 flex flex-col gap-3">
                    <FontSelector
                      value={selectedElement.content.font_family}
                      onChange={(font) =>
                        builder.updateElement(selectedElement.id, {
                          content: { ...selectedElement.content!, font_family: font },
                        })
                      }
                    />
                    <ColorPicker
                      value={selectedElement.content.color}
                      onChange={(color) =>
                        builder.updateElement(selectedElement.id, {
                          content: { ...selectedElement.content!, color },
                        })
                      }
                      label="Text Color"
                    />
                  </div>
                )}
                {selectedElement.type === "shape" && selectedElement.shape && (
                  <div className="mb-3">
                    <ColorPicker
                      value={selectedElement.shape.fill_color}
                      onChange={(color) =>
                        builder.updateElement(selectedElement.id, {
                          shape: { ...selectedElement.shape!, fill_color: color },
                        })
                      }
                      label="Fill Color"
                    />
                  </div>
                )}
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
                  onClick={handleDuplicateSelected}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--fg)] text-sm font-medium hover:bg-[var(--border)]"
                  title="Duplicate (Cmd/Ctrl+D)"
                >
                  Duplicar
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="w-full px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 border border-red-500/30"
                  title="Delete (Del/Backspace)"
                >
                  {t("instagram_builder.buttons.delete")}
                </button>
              </div>
            </div>
          )}
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
