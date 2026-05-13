import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CODE_LANGUAGES,
  PLAINTEXT_LANGUAGE_ID,
  getLanguageLabel,
} from "@/lib/code-languages";

type ItemLanguageSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  triggerClassName?: string;
};

export function ItemLanguageSelect({
  value,
  onValueChange,
  triggerClassName,
}: ItemLanguageSelectProps) {
  return (
    <Select
      value={value || PLAINTEXT_LANGUAGE_ID}
      onValueChange={(nextValue) => {
        const next = typeof nextValue === "string" ? nextValue : "";
        onValueChange(next === PLAINTEXT_LANGUAGE_ID ? "" : next);
      }}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue>
          {(currentValue) =>
            getLanguageLabel(
              typeof currentValue === "string" ? currentValue : null
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CODE_LANGUAGES.map((lang) => (
          <SelectItem key={lang.id} value={lang.id}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
