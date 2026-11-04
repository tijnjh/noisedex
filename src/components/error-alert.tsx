export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="grid size-full grow place-items-center p-3">
      <div className="max-w-xl bg-red-200 p-4 text-red-700">{message}</div>
    </div>
  );
}
