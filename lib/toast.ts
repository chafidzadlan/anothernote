import { toast } from "sonner";

type ToastType = "default" | "success" | "error" | "warning" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
};

export function showToast({ title, description, type = "default", duration }: ToastOptions) {
  const options = { duration };

  switch (type) {
    case "success":
      return toast.success(description || "", { ...options, ...(title && { description: title }) });
    case "error":
      return toast.error(description || "", { ...options, ...(title && { description: title }) });
    case "warning":
      return toast.warning(description || "", { ...options, ...(title && { description: title }) });
    case "info":
      return toast.info(description || "", { ...options, ...(title && { description: title }) });
    default:
      return toast(description || "", { ...options, ...(title && { description: title }) });
  };
};