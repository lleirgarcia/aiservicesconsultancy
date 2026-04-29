// Template configuration and element types for Instagram Post Builder

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  format: "1080x1080";
  config: TemplateConfig;
  created_at: string;
  updated_at: string;
}

export interface TemplateConfig {
  canvas: CanvasConfig;
  elements: TemplateElement[];
  metadata?: {
    thumbnail_url?: string;
  };
}

export interface CanvasConfig {
  width: number;
  height: number;
  background_color: string;
  background_gradient?: {
    type: "linear" | "radial";
    stops: Array<{ color: string; position: number }>;
  };
}

export interface TemplateElement {
  id: string;
  type: "text" | "image" | "shape";
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  content?: TextElementContent;
  image_url?: string;
  shape?: ShapeConfig;
  z_index: number;
  rotation?: number;
  opacity?: number;
}

export interface TextElementContent {
  text: string;
  font_family: string;
  font_size: number;
  font_weight: number | string;
  color: string;
  text_align: "left" | "center" | "right";
  line_height?: number;
}

export interface ShapeConfig {
  type: "rectangle" | "circle" | "line";
  fill_color: string;
  stroke_color?: string;
  stroke_width?: number;
  border_radius?: number;
}

export interface ImageElementContent {
  url: string;
  alt_text?: string;
}

export interface ImageExport {
  blob: Blob;
  format: "image/png" | "image/jpeg";
  width: number;
  height: number;
  filename: string;
  size_bytes: number;
}

// UI State
export interface TemplateBuilderState {
  currentTemplate: TemplateConfig | null;
  selectedElementId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  mode: "create" | "edit" | "view";
}

export interface DragDropState {
  isDragging: boolean;
  draggedElementId: string | null;
  dragOffset: { x: number; y: number };
}
