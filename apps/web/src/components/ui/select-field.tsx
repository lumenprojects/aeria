import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const EMPTY_SELECT_VALUE = "__aeria-empty__";

export type SelectFieldOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectFieldOption[];
  emptyLabel?: string;
  fieldClassName?: string;
  triggerClassName?: string;
  triggerTestId?: string;
};

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  emptyLabel = "Все",
  fieldClassName,
  triggerClassName,
  triggerTestId
}: SelectFieldProps) {
  return (
    <div className={fieldClassName}>
      <span className="navbar-label">{label}</span>
      <Select value={value || EMPTY_SELECT_VALUE} onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_SELECT_VALUE ? "" : nextValue)}>
        <SelectTrigger className={cn("navbar-select", triggerClassName)} aria-label={label} data-testid={triggerTestId}>
          <SelectValue className="navbar-select-value" />
        </SelectTrigger>
        <SelectContent className="navbar-select-content" position="item-aligned">
          <SelectItem value={EMPTY_SELECT_VALUE} className="navbar-select-item">
            <span className="navbar-select-item-content">{emptyLabel}</span>
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="navbar-select-item">
              <span className="navbar-select-item-content">{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
