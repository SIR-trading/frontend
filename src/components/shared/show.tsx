import React from "react";
export default function Show({
  when,
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  when: boolean;
}) {
  if (when) {
    return <>{children}</>;
  } else {
    if (fallback) {
      return <>{fallback}</>;
    }
    return undefined;
  }
}
