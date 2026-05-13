"use client";

import dynamic from "next/dynamic";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { Label } from "@/components/ui/label";

const CodeEditor = dynamic(
  () => import("@/components/items/code-editor").then((m) => m.CodeEditor),
  { ssr: false }
);

type ItemContentFieldProps = {
  id: string;
  label?: string;
  showLabel?: boolean;
  value: string;
  language: string;
  isCode: boolean;
  isMarkdown: boolean;
  accentColor: string;
  onChangeText: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeValue: (value: string) => void;
  placeholder?: string;
  textareaClassName?: string;
  extraControls?: React.ReactNode;
};

export function ItemContentField({
  id,
  label = "Content",
  showLabel = true,
  value,
  language,
  isCode,
  isMarkdown,
  accentColor,
  onChangeText,
  onChangeValue,
  placeholder,
  textareaClassName,
  extraControls,
}: ItemContentFieldProps) {
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <Label htmlFor={id}>
          {label} <span className="text-destructive">*</span>
        </Label>
      )}
      {isCode ? (
        <CodeEditor
          value={value}
          onChange={onChangeValue}
          language={language || undefined}
          accentColor={accentColor}
        />
      ) : isMarkdown ? (
        <MarkdownEditor
          value={value}
          onChange={onChangeValue}
          accentColor={accentColor}
          placeholder={placeholder ?? "Write markdown..."}
          extraControls={extraControls}
        />
      ) : (
        <textarea
          id={id}
          value={value}
          onChange={onChangeText}
          placeholder={placeholder ?? "Enter content..."}
          required
          className={
            textareaClassName ??
            "w-full min-h-[120px] resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          }
        />
      )}
    </div>
  );
}
