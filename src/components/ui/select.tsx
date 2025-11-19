import * as React from "react";
import { cn } from "./utils";
import { ChevronDownIcon } from "lucide-react";

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: '',
  onValueChange: () => {}
});

function Select({
  value,
  onValueChange,
  children,
  ...props
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <SelectContext.Provider value={{ value: value || '', onValueChange: onValueChange || (() => {}) }}>
      <div {...props}>{children}</div>
    </SelectContext.Provider>
  );
}

function SelectGroup({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

function SelectValue({
  placeholder,
  ...props
}: {
  placeholder?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const { value } = React.useContext(SelectContext);
  return <span {...props}>{value || placeholder}</span>;
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </button>
  );
}

function SelectContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-900 shadow-md animate-in fade-in-80",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

function SelectLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value,
  ...props
}: {
  value: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { value: selectedValue, onValueChange } = React.useContext(SelectContext);
  
  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
        selectedValue === value && "bg-gray-100",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </div>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
      {...props}
    />
  );
}

// Wrapper component to handle open/close state
const SelectWrapper = React.forwardRef<
  HTMLDivElement,
  {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
  }
>(({ value, onValueChange, children }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(value || '');

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  const childrenArray = React.Children.toArray(children);
  const trigger = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === SelectTrigger
  );
  const content = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === SelectContent
  );

  return (
    <SelectContext.Provider value={{ value: internalValue, onValueChange: handleValueChange }}>
      <div ref={ref} className="relative">
        <div onClick={() => setOpen(!open)}>
          {trigger}
        </div>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 z-50">
              {content}
            </div>
          </>
        )}
      </div>
    </SelectContext.Provider>
  );
});

SelectWrapper.displayName = "SelectWrapper";

export {
  SelectWrapper as Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
