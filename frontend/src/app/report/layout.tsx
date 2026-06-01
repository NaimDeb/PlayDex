"use client";
import React from "react";

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 text-white bg-off-gray min-h-screen">
      {children}
    </div>
  );
}