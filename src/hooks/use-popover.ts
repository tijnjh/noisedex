import {
  createElement,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createRoot, type Root } from "react-dom/client";

/** shows `content` in a card anchored to the element the returned props are spread on */
export function usePopover(content: ReactNode) {
  const hasContent = content != null;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const anchor = `--popover-${id}`;

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<Root>(undefined);

  useEffect(() => {
    if (!isOpen || !hasContent) return;

    const el = document.createElement("div");
    el.style.setProperty("position-anchor", anchor);
    el.style.setProperty("top", "anchor(bottom)");
    el.style.setProperty("left", "anchor(left)");
    el.style.setProperty(
      "position-try-fallbacks",
      "flip-block, flip-inline, flip-block flip-inline",
    );

    el.className = "surface absolute pointer-coarse:hidden";

    document.body.appendChild(el);

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

  const props: HTMLAttributes<HTMLElement> = {
    onMouseEnter: open,
    onMouseLeave: close,
    onFocus: open,
    onBlur: close,
  };

  return props;
}
