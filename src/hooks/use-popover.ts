import {
  HTMLAttributes,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";

export function usePopover(content: ReactNode) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const anchor = `--popover-${id}`;

  const [isHovering, setIsHovering] = useState(false);

  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  useEffect(() => {
    if (!isHovering) return;

    const el = document.createElement("div");
    el.style.setProperty("position-anchor", anchor);
    el.style.setProperty("top", "anchor(bottom)");
    el.style.setProperty("left", "anchor(left)");
    el.style.setProperty(
      "position-try-fallbacks",
      "flip-block, flip-inline, flip-block flip-inline",
    );

    el.className = "absolute bg-zinc-50-950 pointer-coarse:hidden";

    document.body.appendChild(el);

    const root = createRoot(el);
    rootRef.current = root;
    root.render(content);

    return () => {
      root.unmount();
      rootRef.current = null;
      el.remove();
    };
  }, [isHovering, anchor, content]);

  const open = (event: { currentTarget: HTMLElement }) => {
    setIsHovering(true);
    event.currentTarget.style.setProperty("anchor-name", anchor);
  };

  const close = () => setIsHovering(false);

  const props: HTMLAttributes<HTMLElement> = {
    onMouseEnter: open,
    onMouseLeave: close,
    onFocus: open,
    onBlur: close,
    // onPointerDown: (event) => {
    //   if (event.pointerType === "touch") {
    //     open(event);
    //   }
    // },
  };

  return props;
}
