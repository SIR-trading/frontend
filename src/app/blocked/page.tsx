export default function Page() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-lg">
          Your country is blocked from accessing this site.
        </p>
        <p className="text-gray-500 text-sm">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
