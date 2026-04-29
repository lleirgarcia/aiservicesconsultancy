"use client";

import { useEffect, useRef, useState } from "react";
import { TemplateElement } from "@/types/instagram-builder";

interface InlineTextEditorProps {
  element: TemplateElement;
  canvasRef: HTMLCanvasElement;
  onChange: (text: string) => void;
  onClose: () => void;
}

export function InlineTextEditor({
  element,
  canvasRef,
  onChange,
  onClose,
}: InlineTextEditorProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(element.content?.text || "");
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    const rect = canvasRef.getBoundingClientRect();
    const parentRect = canvasRef.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const scaleX = rect.width / 1080;
    const scaleY = rect.height / 1080;

    const offsetX = rect.left - parentRect.left;
    const offsetY = rect.top - parentRect.top;

    setPosition({
      left: offsetX + element.position.x * scaleX,
      top: offsetY + element.position.y * scaleY,
      width: element.size.width * scaleX,
      height: element.size.height * scaleY,
    });
  }, [element, canvasRef]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleBlur = () => {
    onChange(text);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onChange(text);
      onClose();
    }
  };

  const fontSize = element.content?.font_size || 48;
  const rect = canvasRef.getBoundingClientRect();
  const scaledFontSize = fontSize * (rect.width / 1080);

  return (
    <textarea
      ref={inputRef}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        fontFamily: element.content?.font_family || "Inter",
        fontSize: `${scaledFontSize}px`,
        fontWeight: element.content?.font_weight || 400,
        color: element.content?.color || "#000",
        textAlign: element.content?.text_align || "left",
        lineHeight: element.content?.line_height || 1.2,
        background: "rgba(0, 0, 0, 0.4)",
        border: "2px solid #89ceff",
        borderRadius: "4px",
        padding: "0",
        outline: "none",
        resize: "none",
        overflow: "hidden",
      }}
    />
  );
}
