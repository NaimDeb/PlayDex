/**
 * Alert components for displaying messages to users
 * Replaces duplicate alert patterns across the codebase
 */

import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

interface AlertProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * Warning alert with yellow styling
 * @example
 * <WarningAlert title="Attention !">
 *   This action cannot be undone.
 * </WarningAlert>
 */
export function WarningAlert({ children, title = "Attention !", className = "" }: AlertProps) {
  return (
    <div className={`bg-yellow-900 border-l-4 border-yellow-500 text-yellow-100 p-4 my-6 rounded-md flex items-start ${className}`}>
      <FaExclamationTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={20} />
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        <div className="text-sm mt-1">{children}</div>
      </div>
    </div>
  );
}

/**
 * Error alert with red styling
 * @example
 * <ErrorAlert title="Erreur">
 *   Something went wrong.
 * </ErrorAlert>
 */
export function ErrorAlert({ children, title = "Erreur", className = "" }: AlertProps) {
  return (
    <div className={`bg-red-900 border-l-4 border-red-500 text-red-100 p-4 my-6 rounded-md flex items-start ${className}`}>
      <FaTimesCircle className="text-red-500 mt-1 mr-3 flex-shrink-0" size={20} />
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        <div className="text-sm mt-1">{children}</div>
      </div>
    </div>
  );
}

/**
 * Success alert with green styling
 * @example
 * <SuccessAlert title="Succès !">
 *   Your changes have been saved.
 * </SuccessAlert>
 */
export function SuccessAlert({ children, title = "Succès !", className = "" }: AlertProps) {
  return (
    <div className={`bg-green-900 border-l-4 border-green-500 text-green-100 p-4 my-6 rounded-md flex items-start ${className}`}>
      <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" size={20} />
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        <div className="text-sm mt-1">{children}</div>
      </div>
    </div>
  );
}

/**
 * Info alert with blue styling
 * @example
 * <InfoAlert title="Information">
 *   Here's some helpful information.
 * </InfoAlert>
 */
export function InfoAlert({ children, title = "Information", className = "" }: AlertProps) {
  return (
    <div className={`bg-blue-900 border-l-4 border-blue-500 text-blue-100 p-4 my-6 rounded-md flex items-start ${className}`}>
      <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={20} />
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        <div className="text-sm mt-1">{children}</div>
      </div>
    </div>
  );
}
