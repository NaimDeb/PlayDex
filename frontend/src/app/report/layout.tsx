"use client";

import React from "react";

type ReportLayoutProps = {
  children: React.ReactNode;
};

export default function ReportLayout({ children }: ReportLayoutProps) {
  return (
    <div className="container mx-auto px-6 py-10 text-white">
      {children}
    </div>
  );
}