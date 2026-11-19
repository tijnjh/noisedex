import { createElement, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

// spread the returned props on the element to anchor to
export function usePopover(content: ReactNode) {
  const hasContent = content != null;
  const anchor = `--popover-${useId().replace(/[^\w-]/g, "")}`;

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<Root>(undefined);

  useEffect(() => {
    if (!isOpen || !hasContent) return;

    const el = document.createElement("div");
    el.className = "surface absolute pointer-coarse:hidden";
    el.style.cssText = `position-anchor: ${anchor}; top: anchor(bottom); left: anchor(left); position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline`;
    document.body.append(el);

    const root = createRoot(el);
    rootRef.current = root;

    return () => {
      rootRef.current = undefined;
      root.unmount();
      el.remove();
    };
  }, [isOpen, hasContent, anchor]);

  useEffect(() => {
    rootRef.current?.render(
      createElement("div", { className: "flex w-72 flex-col gap-3 p-3 wrap-break-word" }, content),
    );
  }, [isOpen, hasContent, content]);

  const open = (event: { currentTarget: HTMLElement }) => {
    setIsOpen(true);
    event.currentTarget.style.setProperty("anchor-name", anchor);
  };

  const close = () => setIsOpen(false);

  return { onMouseEnter: open, onMouseLeave: close, onFocus: open, onBlur: close };
}
