import React from "react";

export type FlashMessageType = "success" | "error" | "info" | "warning";

interface FlashMessageProps {
  message: string;
  type?: FlashMessageType;
  onClose: () => void;
}

const typeStyles = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
  warning: "bg-yellow-500 text-black",
};

export const FlashMessage: React.FC<FlashMessageProps> = ({
  message,
  type = "info",
  onClose,
}) => {
  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg z-50 flex items-center gap-4 ${typeStyles[type]}`}
      role="alert"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-lg font-bold focus:outline-none"
      >
        &times;
      </button>
    </div>
  );
};
