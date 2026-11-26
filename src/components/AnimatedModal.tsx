"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface AnimatedModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
  roundedClass?: string;
  paddingClass?: string;
  centerOnMobile?: boolean;
  zIndexClass?: string;
  cardClassName?: string;
}

export function AnimatedModal({
  open,
  onClose,
  children,
  maxWidthClass = "max-w-[400px]",
  roundedClass = "rounded-[30px]",
  paddingClass = "p-6",
  centerOnMobile = false,
  zIndexClass = "z-[9999]",
  cardClassName = "",
}: AnimatedModalProps) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);
  const cachedChildrenRef = useRef<React.ReactNode>(children);

  if (open && children) {
    cachedChildrenRef.current = children;
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setEntered(true);
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    } else {
      setEntered(false);
      const timer = setTimeout(() => {
        setRendered(false);
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!mounted || !rendered) return null;

  const isActive = open && entered;
  const contentToRender = open ? children : cachedChildrenRef.current;

  return createPortal(
    <div
      onClick={() => {
        if (open) onClose();
      }}
      className={`fixed inset-0 ${zIndexClass} flex ${
        centerOnMobile ? "items-center" : "items-end sm:items-center"
      } justify-center p-4 bg-black/45 transition-opacity duration-250 ease-out transform-gpu ${
        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthClass} bg-white ${roundedClass} ${paddingClass} space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.22)] border border-[#EFECE6] transition-[transform,opacity] duration-280 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu ${
          isActive
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-6 scale-[0.96] pointer-events-none"
        } ${cardClassName}`}
      >
        {contentToRender}
      </div>
    </div>,
    document.body
  );
}
