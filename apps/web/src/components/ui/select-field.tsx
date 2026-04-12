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
    <div className={cn("control-field", fieldClassName)}>
      <span className="control-label">{label}</span>
      <Select value={value || EMPTY_SELECT_VALUE} onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_SELECT_VALUE ? "" : nextValue)}>
        <SelectTrigger
          className={cn("select-field-trigger", triggerClassName)}
          aria-label={label}
          data-testid={triggerTestId}
        >
          <SelectValue className="select-field-value" />
        </SelectTrigger>
        <SelectContent className="select-field-content" position="item-aligned">
          <SelectItem value={EMPTY_SELECT_VALUE} className="select-field-item">
            <span className="select-field-item-content">{emptyLabel}</span>
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="select-field-item">
              <span className="select-field-item-content">{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
