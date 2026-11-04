import { useLocation, useNavigate } from "@tanstack/react-router";

export function useQueryState(
  key: string,
  { defaultValue = "" }: { defaultValue: string },
) {
  const search = useLocation({ select: (location) => location.search });
  const navigate = useNavigate();
  const current = search[key as keyof typeof search];
  const value = typeof current === "string" ? current : defaultValue;

  const setValue = (next: string) => {
    void navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        [key]: next === defaultValue ? undefined : next,
      }),
      replace: true,
      resetScroll: false,
    });
  };

  return [value, setValue] as const;
}
