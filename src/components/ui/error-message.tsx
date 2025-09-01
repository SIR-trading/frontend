export default function ErrorMessage({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-start pt-[2px]">
      <p
        data-disabled={disabled ? "true" : "false"}
        className="text-red h-[13px] text-left text-sm data-[disabled=true]:opacity-0"
      >
        {children}
      </p>
    </div>
  );
}
