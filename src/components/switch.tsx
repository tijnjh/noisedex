import * as BaseUi from "@base-ui/react/switch";

export function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <BaseUi.Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="flex h-5 w-9 shrink-0 border border-neutral-950 bg-white p-0.5 transition-colors duration-150 ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 data-checked:bg-neutral-950 dark:border-white dark:bg-neutral-950 dark:focus-visible:outline-white dark:data-checked:bg-white"
    >
      <BaseUi.Switch.Thumb className="size-3.5 bg-neutral-950 transition-[translate,background-color] duration-150 ease-[ease] data-checked:translate-x-4 data-checked:bg-white dark:bg-white dark:data-checked:bg-neutral-950" />
    </BaseUi.Switch.Root>
  );
}
