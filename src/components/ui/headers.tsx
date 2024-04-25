import React, { type ReactNode } from "react";

import { cn } from "@/lib/utils";
export type HeadeOneProps = React.HtmlHTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
};

const HeadOne = React.forwardRef<HTMLHeadingElement, HeadeOneProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h1
        className={cn("font-lora text-[32px] font-bold", className)}
        ref={ref}
        {...props}
      >
        {children}
      </h1>
    );
  },
);
HeadOne.displayName = "HeadeOne";

export { HeadOne };
