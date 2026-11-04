import { VirtualGrid } from "../src/components/virtual-grid";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let viewportWidth: number;
const viewportHeight = 240;
const observers = new Set<MockResizeObserver>();

class MockResizeObserver {
  targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    observers.add(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
    observers.delete(this);
  }
}

const entries = Array.from({ length: 300 }, (_, id) => ({
  id,
  name: `Item ${id}`,
}));

function Grid({ items = entries }: { items?: typeof entries }) {
  return (
    <VirtualGrid entries={items} getKey={(entry) => entry.id}>
      {(entry) => <span>{entry.name}</span>}
    </VirtualGrid>
  );
}

beforeEach(() => {
  viewportWidth = 844;
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
    () => viewportWidth,
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
    () => viewportHeight,
  );
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      const list = this.querySelector("ul");
      return list ? parseFloat(list.style.height) + 24 : viewportHeight;
    },
  );
  vi.spyOn(window, "getComputedStyle").mockImplementation(
    (element) =>
      ({
        fontSize: "16px",
        paddingTop: element.classList.contains("p-3") ? "12px" : "0px",
        paddingLeft: element.classList.contains("p-3") ? "12px" : "0px",
        paddingRight: element.classList.contains("p-3") ? "12px" : "0px",
      }) as CSSStyleDeclaration,
  );
  vi.stubGlobal("getComputedStyle", window.getComputedStyle);
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: function (this: HTMLElement, options: ScrollToOptions) {
      this.scrollTop = Math.max(
        0,
        Math.min(options.top ?? 0, this.scrollHeight - this.clientHeight),
      );
      this.dispatchEvent(new Event("scroll"));
    },
  });
});

afterEach(() => {
  cleanup();
  observers.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
});

describe("VirtualGrid", () => {
  it("renders a bounded range, then renders later entries when scrolling", () => {
    const view = render(<Grid />);
    const scrollElement = view.container.firstElementChild as HTMLElement;
    expect(view.getByText("Item 0")).toBeTruthy();
    expect(view.queryByText("Item 299")).toBeNull();
    expect(view.container.querySelectorAll("li").length).toBeLessThan(100);
    expect(view.container.querySelector("li")?.style.width).toBe("196px");

    fireEvent.scroll(scrollElement, { target: { scrollTop: 2000 } });
    expect(view.queryByText("Item 0")).toBeNull();
    expect(view.getByText("Item 180")).toBeTruthy();
  });

  it("recalculates columns on resize and disconnects observers on unmount", () => {
    const view = render(<Grid />);
    expect(view.container.querySelectorAll("li")[1].style.transform).toBe(
      "translate(208px, 0px)",
    );

    act(() => {
      viewportWidth = 344;
      for (const observer of observers) {
        observer.callback([], observer as unknown as ResizeObserver);
      }
    });

    expect(view.container.querySelector("li")?.style.width).toBe("320px");
    expect(view.container.querySelectorAll("li")[1].style.transform).toBe(
      "translate(0px, 48px)",
    );
    view.unmount();
    expect([...observers].every((observer) => !observer.targets.size)).toBe(
      true,
    );
  });

  it("returns to visible results when filtering from a deep scroll position", () => {
    const view = render(<Grid />);
    const scrollElement = view.container.firstElementChild as HTMLElement;
    fireEvent.scroll(scrollElement, { target: { scrollTop: 2000 } });
    expect(view.queryByText("Item 0")).toBeNull();

    view.rerender(<Grid items={entries.slice(-5)} />);
    expect(scrollElement.scrollTop).toBe(0);
    expect(view.container.querySelectorAll("li")).toHaveLength(5);
    expect(view.getByText("Item 295")).toBeTruthy();

    view.rerender(<Grid items={[]} />);
    expect(view.container.querySelectorAll("li")).toHaveLength(0);
    view.rerender(<Grid />);
    expect(view.getByText("Item 0")).toBeTruthy();
  });

  it("forwards the list ref and supports falsy entries", () => {
    const ref = createRef<HTMLUListElement>();
    const view = render(
      <VirtualGrid entries={[0, 1]} gridRef={ref} getKey={(entry) => entry}>
        {(entry) => <span>Number {entry}</span>}
      </VirtualGrid>,
    );
    expect(ref.current).toBe(view.container.querySelector("ul"));
    expect(view.getByText("Number 0")).toBeTruthy();
  });

  it("hydrates server rows and then measures the client viewport", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Grid />);
    document.body.append(container);
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Grid />, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector("li")?.textContent).toBe("Item 0");
      expect(container.querySelector("li")?.style.width).toBe("196px");
      expect(container.querySelectorAll("li").length).toBeLessThan(100);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it("server-renders initial rows without rendering the entire catalog", () => {
    const html = renderToString(<Grid />);
    expect(html).toContain("Item 0");
    expect(html).not.toContain("Item 299");
    expect(html.match(/<li\b/g)?.length).toBeGreaterThan(0);
    expect(html.match(/<li\b/g)?.length).toBeLessThan(100);
  });
});
