export default function ErrorMessage({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex w-[280px] justify-start  pt-[2px] md:w-[450px]">
      <p
        data-disabled={disabled ? "true" : "false"}
        className="h-[13px] text-left text-sm text-red-400 data-[disabled=true]:opacity-0"
      >
        {children}
      </p>
    </div>
  );
}
