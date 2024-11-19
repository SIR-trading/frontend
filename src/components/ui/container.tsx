import React, { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ContainerProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("mx-auto px-4 xl:px-0 ", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Container.displayName = "Container";

export { Container };
