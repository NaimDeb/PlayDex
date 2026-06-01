"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { FlashMessage, FlashMessageType } from "./FlashMessage";

interface FlashMessageContextType {
  showMessage: (message: string, type?: FlashMessageType) => void;
}

const FlashMessageContext = createContext<FlashMessageContextType | undefined>(
  undefined
);

export const useFlashMessage = () => {
  const ctx = useContext(FlashMessageContext);
  if (!ctx)
    throw new Error(
      "useFlashMessage must be used within a FlashMessageProvider"
    );
  return ctx;
};

export const FlashMessageProvider = ({ children }: { children: ReactNode }) => {
  const [flash, setFlash] = useState<{
    message: string;
    type: FlashMessageType;
  } | null>(null);

  const showMessage = useCallback(
    (message: string, type: FlashMessageType = "info") => {
      setFlash({ message, type });
      setTimeout(() => setFlash(null), 3500);
    },
    []
  );

  const handleClose = () => setFlash(null);

  return (
    <FlashMessageContext.Provider value={{ showMessage }}>
      {children}
      {flash && (
        <FlashMessage
          message={flash.message}
          type={flash.type}
          onClose={handleClose}
        />
      )}
    </FlashMessageContext.Provider>
  );
};
