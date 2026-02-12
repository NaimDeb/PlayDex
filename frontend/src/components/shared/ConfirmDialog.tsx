/**
 * Confirmation dialog component using Radix UI
 * Replaces window.confirm() with accessible modal dialogs
 */

'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  /** Trigger element (usually a button) */
  trigger: React.ReactNode;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Optional callback when user cancels */
  onCancel?: () => void;
  /** Destructive action styling (red button) */
  destructive?: boolean;
}

/**
 * Confirmation dialog for important user actions
 * @example
 * <ConfirmDialog
 *   trigger={<button>Delete</button>}
 *   title="Supprimer l'utilisateur"
 *   description="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
 *   confirmText="Supprimer"
 *   onConfirm={() => deleteUser(id)}
 *   destructive
 * />
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
