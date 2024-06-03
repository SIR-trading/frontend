import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import React from "react";

const alertDialogContentVariants = cva(
  `fixed h-screen z-20  top-0  duration-500 bg-white`,
  {
    variants: {
      containerSize: {
        md: "w-[320px] md:w-[400px]",
      },
      align: {
        left: "x-left-anim data-[state=closed]:animate-[translate-x-left-back-anim_500ms]",
        right:
          "x-right-anim right-0 data-[state=closed]:animate-[translate-x-right-back-anim_500ms]",
        center:
          "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-none h-fit",
      },
      animate: {
        none: "transition-none",
      },
      background: {
        white: "bg-white",
      },
    },
    defaultVariants: {
      align: "left",

      background: "white",
    },
  },
);
const alertDialogCloseVariants = cva(
  "absolute  top-4 cursor-pointer hover:scale-105 duration-200 select-none !outline-none z-10",
  {
    variants: {
      align: {
        left: "left-3",
        right: "right-5",
        center: "right-3",
      },
      closeColor: {
        white: "text-white",
        black: "text-black",
      },
    },
    defaultVariants: {
      align: "right",
      closeColor: "black",
    },
  },
);
interface alertDialogContentProps
  extends VariantProps<typeof alertDialogContentVariants>,
    VariantProps<typeof alertDialogCloseVariants>,
    // VariantProps<typeof alertDialogCloseVariants>,
    React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  title?: string;
}

const AlertDialog = Dialog.Root;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, children, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(
      `data-[state:closed]:animate-out data-[state:closed]:fade-out data-[state:closed]:duration-1000 fixed inset-0 bg-black/50 backdrop-blur-sm
      duration-1000
      fade-in
      data-[state=open]:animate-in 
      `,
      className,
    )}
    {...props}
  >
    {children}
  </Dialog.Overlay>
));
AlertDialogOverlay.displayName = Dialog.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  alertDialogContentProps
>(
  (
    {
      children,
      align,
      animate,
      background,
      className,
      containerSize,

      closeColor,
    },
    ref,
  ) => {
    return (
      <Dialog.Portal>
        <AlertDialogOverlay ref={ref} />
        <Dialog.Content
          className={cn(
            alertDialogContentVariants({
              align,
              animate,
              background,
              containerSize,
            }),
            className,
          )}
        >
          <Dialog.Close
            className={cn(alertDialogCloseVariants({ align, closeColor }))}
          >
            X
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    );
  },
);
const AlertDialogTrigger = React.forwardRef<
  React.ElementRef<typeof Dialog.Trigger>,
  React.ComponentPropsWithoutRef<typeof Dialog.Trigger>
>(({ className, children, ...props }, ref) => (
  <Dialog.Trigger className={cn("", className)} ref={ref} {...props}>
    {children}
  </Dialog.Trigger>
));

const AlertDialogPortal: React.FC<
  React.ComponentPropsWithoutRef<typeof Dialog.Portal>
> = ({ children, ...props }) => (
  <Dialog.Portal {...props}>{children}</Dialog.Portal>
);

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
};
