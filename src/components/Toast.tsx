"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function Toast({
  message,
  type,
  onClose,
  autoClose = true,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const bgColor = {
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    error: "bg-red-500/10 border-red-500/30 text-red-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  }[type];

  return (
    <div className={`rounded-lg border p-4 ${bgColor} animate-in fade-in slide-in-from-top-4 duration-300`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
