import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CollectionFormState = {
  name: string;
  description: string;
};

type CollectionFormFieldsProps = {
  idPrefix: string;
  form: CollectionFormState;
  onChange: (
    field: keyof CollectionFormState
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export function CollectionFormFields({
  idPrefix,
  form,
  onChange,
}: CollectionFormFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-name`}>
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={onChange("name")}
          placeholder="e.g. React Patterns"
          required
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={onChange("description")}
          placeholder="Optional description"
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </>
  );
}
