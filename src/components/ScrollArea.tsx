"use client";

import React from "react";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxHeightClass?: string;
}

export function ScrollArea({
  children,
  className = "",
  maxHeightClass = "",
  ...rest
}: ScrollAreaProps) {
  return (
    <div
      className={`custom-scrollbar overflow-y-auto pr-1.5 ${maxHeightClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
