"use client";

import React from "react";
import { BackButton } from "@/components/BackButton";

type ReportLayoutProps = {
  children: React.ReactNode;
};

export default function ReportLayout({ children }: ReportLayoutProps) {
  return (
    <div className="container mx-auto px-6 py-10 text-white">
      <BackButton />
      {children}
    </div>
  );
}