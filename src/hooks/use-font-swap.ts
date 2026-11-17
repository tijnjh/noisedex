import { useEffect, useState, type CSSProperties } from "react";

const fadeMs = 200;
// don't keep the text hidden forever when a font is slow to load
const loadTimeoutMs = 1500;

// any font change fades the text out, swaps the new style in once its face has loaded, and fades back in
export function useFontSwap(style: CSSProperties | undefined): CSSProperties {
  const [shown, setShown] = useState(style);
  const targetKey = JSON.stringify(style ?? {});
  const swapping = targetKey !== JSON.stringify(shown ?? {});

  const { fontStyle, fontWeight, fontFamily } = style ?? {};
  useEffect(() => {
    if (!swapping) return;

    let active = true;
    void Promise.all([
      wait(fadeMs),
      Promise.race([loadFont(fontStyle, fontWeight, fontFamily), wait(loadTimeoutMs)]),
    ]).then(() => {
      if (active) setShown(JSON.parse(targetKey) as CSSProperties);
    });

    return () => {
      active = false;
    };
  }, [swapping, targetKey, fontStyle, fontWeight, fontFamily]);

  return { ...shown, opacity: swapping ? 0 : 1, transition: `opacity ${fadeMs}ms` };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadFont(
  fontStyle: CSSProperties["fontStyle"] = "normal",
  fontWeight: CSSProperties["fontWeight"] = 400,
  fontFamily: CSSProperties["fontFamily"] = "var(--font-sans)",
) {
  const variable = /^var\((--[\w-]+)\)$/.exec(fontFamily)?.[1];
  const family = variable
    ? getComputedStyle(document.documentElement).getPropertyValue(variable)
    : fontFamily;
  await document.fonts.load(`${fontStyle} ${fontWeight} 1em ${family}`).catch(() => {});
}
