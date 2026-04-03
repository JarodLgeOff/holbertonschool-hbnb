"use client";

import * as React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function Sheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return <SheetContext.Provider value={{ open, setOpen: onOpenChange }}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const context = React.useContext(SheetContext);

  if (!context) {
    throw new Error("SheetTrigger must be used within Sheet");
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

function SheetClose({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const context = React.useContext(SheetContext);

  if (!context) {
    throw new Error("SheetClose must be used within Sheet");
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

function SheetContent({ className, side = "right", children }: { className?: string; side?: "left" | "right"; children: React.ReactNode }) {
  const context = React.useContext(SheetContext);
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
    <div className="fixed inset-0 z-50">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => context.setOpen(false)} />
      <div
        className={cn(
          "absolute top-0 h-full w-full max-w-sm border-border bg-background p-6 shadow-2xl transition-transform",
          side === "right" ? "right-0 rounded-l-3xl border-l" : "left-0 rounded-r-3xl border-r",
          className
        )}
      >
        <button
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => context.setOpen(false)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2 text-left", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-2xl font-semibold tracking-tight", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto flex items-center gap-3", className)} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };