"use client";

import * as React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const context = React.useContext(DialogContext);

  if (!context) {
    throw new Error("DialogTrigger must be used within Dialog");
  }

  if (asChild) {
    return React.cloneElement(children, {
      onClick: (event: React.MouseEvent) => {
        children.props.onClick?.(event);
        context.setOpen(true);
      },
    });
  }

  return <Button onClick={() => context.setOpen(true)}>{children}</Button>;
}

function DialogClose({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const context = React.useContext(DialogContext);

  if (!context) {
    throw new Error("DialogClose must be used within Dialog");
  }

  if (asChild) {
    return React.cloneElement(children, {
      onClick: (event: React.MouseEvent) => {
        children.props.onClick?.(event);
        context.setOpen(false);
      },
    });
  }

  return <Button variant="outline" onClick={() => context.setOpen(false)}>{children}</Button>;
}

function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const context = React.useContext(DialogContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!context?.open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        context.setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [context]);

  if (!mounted || !context?.open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => context.setOpen(false)} />
      <div className={cn("relative w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-2xl", className)}>{children}</div>
    </div>,
    document.body
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2 text-left", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-2xl font-semibold tracking-tight", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex items-center justify-end gap-3", className)} {...props} />;
}

function DialogPrimitiveClose({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(DialogContext);

  return (
    <button
      aria-label="Fermer"
      className={cn("absolute right-4 top-4 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", className)}
      onClick={() => context?.setOpen(false)}
      type="button"
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPrimitiveClose as DialogCloseButton,
  DialogTitle,
  DialogTrigger,
};