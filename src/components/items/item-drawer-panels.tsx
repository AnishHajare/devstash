"use client";

import dynamic from "next/dynamic";
import { toast } from "sonner";
import { CollectionMultiSelect } from "@/components/items/collection-multi-select";
import {
  DescribeButton,
  DescribeSuggestion,
  useDescribeSuggestion,
} from "@/components/items/ai/generate-description-button";
import {
  ExplainCodeButton,
  useCodeExplanation,
} from "@/components/items/ai/explain-code-button";
import {
  OptimizePromptButton,
  OptimizePromptSuggestion,
  usePromptOptimizer,
} from "@/components/items/ai/optimize-prompt-button";
import { SuggestTagsButton } from "@/components/items/ai/suggest-tags-button";
import { mergeTagString } from "@/components/items/ai/tag-utils";
import { ItemContentField } from "@/components/items/item-content-field";
import { ItemLanguageSelect } from "@/components/items/item-language-select";
import { MarkdownView } from "@/components/items/markdown-editor";
import { formatLongDate } from "@/lib/date-format";
import { formatBytes } from "@/lib/format-bytes";
import { FolderOpen, Tag, Calendar, FileText } from "lucide-react";
import type { ItemDetail } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";

const CodeEditor = dynamic(
  () => import("@/components/items/code-editor").then((m) => m.CodeEditor),
  { ssr: false }
);

export type EditState = {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
  collectionIds: string[];
};

type ItemEditBodyProps = {
  item: ItemDetail;
  editState: EditState;
  field: (
    key: keyof EditState
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setEditState: React.Dispatch<React.SetStateAction<EditState | null>>;
  showContent: boolean;
  showLanguage: boolean;
  showMarkdown: boolean;
  showUrl: boolean;
  collections: CollectionOption[];
  isPro: boolean;
};

export function ItemEditBody({
  item,
  editState,
  field,
  setEditState,
  showContent,
  showLanguage,
  showMarkdown,
  showUrl,
  collections,
  isPro,
}: ItemEditBodyProps) {
  const describe = useDescribeSuggestion({
    isPro,
    typeName: item.itemType.name,
    title: editState.title,
    content: editState.content,
    url: editState.url,
    language: editState.language,
    fileName: item.fileName ?? "",
    tags: editState.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    currentDescription: editState.description,
    onAccept: (description) =>
      setEditState((prev) => (prev ? { ...prev, description } : prev)),
  });
  const optimize = usePromptOptimizer({
    itemId: item.id,
    isPro,
    currentContent: editState.content,
    onAccept: (optimizedPrompt) => {
      setEditState((prev) =>
        prev
          ? {
              ...prev,
              content: optimizedPrompt,
            }
          : prev
      );
      toast.success("Optimized prompt applied");
    },
  });
  const canOptimizePrompt =
    showMarkdown && item.itemType.name.toLowerCase() === "prompt";

  return (
    <>
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <SectionLabel>Description</SectionLabel>
          <DescribeButton state={describe} />
        </div>
        <EditTextarea
          value={editState.description}
          onChange={field("description")}
          placeholder="Optional description…"
          accentColor={item.itemType.color}
          className="min-h-[72px] px-3 py-2.5 text-sm leading-relaxed"
        />
        <DescribeSuggestion state={describe} />
      </section>

      {showLanguage && (
        <section>
          <SectionLabel>Language</SectionLabel>
          <ItemLanguageSelect
            value={editState.language}
            onValueChange={(language) =>
              setEditState((prev) =>
                prev
                  ? {
                      ...prev,
                      language,
                    }
                  : prev
              )
            }
          />
        </section>
      )}

      {showContent && (
        <section>
          <SectionLabel>Content</SectionLabel>
          <ItemContentField
            id={`item-edit-content-${item.id}`}
            showLabel={false}
            value={editState.content}
            language={editState.language}
            isCode={showLanguage}
            isMarkdown={showMarkdown}
            accentColor={item.itemType.color}
            onChangeText={field("content")}
            onChangeValue={(content) =>
              setEditState((prev) => (prev ? { ...prev, content } : prev))
            }
            placeholder={showMarkdown ? "Write markdown..." : "Content…"}
            textareaClassName="w-full min-h-[260px] resize-none rounded-md border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:bg-muted/70"
            extraControls={
              canOptimizePrompt ? <OptimizePromptButton state={optimize} /> : undefined
            }
          />
          {canOptimizePrompt && (
            <OptimizePromptSuggestion
              state={optimize}
              className="mt-3 rounded-md border border-dashed border-border/80 bg-muted/20 p-2"
            />
          )}
        </section>
      )}

      {showUrl && (
        <section>
          <SectionLabel>URL</SectionLabel>
          <EditInput
            type="url"
            value={editState.url}
            onChange={field("url")}
            placeholder="https://…"
            accentColor={item.itemType.color}
          />
        </section>
      )}

      <section>
        <SectionLabel icon={<Tag className="h-3 w-3" />}>Tags</SectionLabel>
        <EditInput
          type="text"
          value={editState.tags}
          onChange={field("tags")}
          placeholder="react, hooks, typescript"
          accentColor={item.itemType.color}
        />
        {isPro && (
          <div className="mt-2">
            <SuggestTagsButton
              itemId={item.id}
              title={editState.title}
              content={editState.content}
              typeName={item.itemType.name}
              existingTags={editState.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)}
              onAccept={(tag) =>
                setEditState((prev) =>
                  prev
                    ? {
                        ...prev,
                        tags: mergeTagString(prev.tags, tag),
                      }
                    : prev
                )
              }
            />
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">Comma-separated</p>
      </section>

      <section>
        <CollectionMultiSelect
          collections={collections}
          selectedIds={editState.collectionIds}
          onChange={(collectionIds) =>
            setEditState((prev) => (prev ? { ...prev, collectionIds } : prev))
          }
        />
      </section>

      <ItemDetailsSection createdAt={item.createdAt} updatedAt={item.updatedAt} />
    </>
  );
}

type ItemViewBodyProps = {
  item: ItemDetail;
  isPro: boolean;
  showLanguage: boolean;
  showMarkdown: boolean;
  showFile: boolean;
  downloadUrl: string | null;
  typeName: string;
  onAcceptOptimizedPrompt: (nextContent: string) => Promise<
    { success: true; data: ItemDetail } | { success: false; error: string }
  >;
  onItemUpdated: (nextItem: ItemDetail) => void;
};

export function ItemViewBody({
  item,
  isPro,
  showLanguage,
  showMarkdown,
  showFile,
  downloadUrl,
  typeName,
  onAcceptOptimizedPrompt,
  onItemUpdated,
}: ItemViewBodyProps) {
  const explain = useCodeExplanation({
    itemId: item.id,
    isPro,
  });
  const optimize = usePromptOptimizer({
    itemId: item.id,
    isPro,
    currentContent: item.content ?? "",
    onAccept: async (optimizedPrompt) => {
      const result = await onAcceptOptimizedPrompt(optimizedPrompt);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }

      onItemUpdated(result.data);
      return true;
    },
  });
  const canExplainCode =
    showLanguage && (typeName === "snippet" || typeName === "command");
  const canOptimizePrompt = showMarkdown && typeName === "prompt";
  const hasExplanation = Boolean(explain.explanation);
  const currentView = hasExplanation ? explain.view : "code";
  const hasOptimizedPrompt = Boolean(optimize.optimizedPrompt);
  const currentPromptView = hasOptimizedPrompt ? optimize.view : "prompt";

  return (
    <>
      {item.description && (
        <section>
          <SectionLabel>Description</SectionLabel>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </section>
      )}

      {item.content && (
        <section>
          <SectionLabel>Content</SectionLabel>
          {showLanguage ? (
            <CodeEditor
              value={item.content}
              language={
                currentView === "explain" ? undefined : item.language ?? undefined
              }
              readOnly
              copyValue={
                currentView === "explain"
                  ? explain.explanation ?? item.content
                  : item.content
              }
              headerTabs={
                hasExplanation
                  ? {
                      value: currentView,
                      onChange: (next) =>
                        explain.setView(next === "explain" ? "explain" : "code"),
                      options: [
                        { value: "code", label: "Code" },
                        { value: "explain", label: "Explain" },
                      ],
                    }
                  : undefined
              }
              extraControls={
                canExplainCode && !hasExplanation ? (
                  <ExplainCodeButton state={explain} />
                ) : undefined
              }
              body={
                currentView === "explain" && explain.explanation ? (
                  <MarkdownView
                    content={explain.explanation}
                    className="h-full overflow-y-auto rounded-none border-0"
                    backgroundColor="transparent"
                  />
                ) : undefined
              }
            />
          ) : showMarkdown ? (
            <MarkdownView
              content={item.content}
              copyValue={
                currentPromptView === "optimize"
                  ? optimize.optimizedPrompt ?? item.content
                  : item.content
              }
              headerTabs={
                hasOptimizedPrompt
                  ? {
                      value: currentPromptView,
                      onChange: (next) =>
                        optimize.setView(next === "optimize" ? "optimize" : "prompt"),
                      options: [
                        { value: "prompt", label: "Prompt" },
                        { value: "optimize", label: "Optimize" },
                      ],
                    }
                  : undefined
              }
              extraControls={
                canOptimizePrompt && !hasOptimizedPrompt ? (
                  <OptimizePromptButton state={optimize} />
                ) : undefined
              }
              body={
                currentPromptView === "optimize" && optimize.optimizedPrompt ? (
                  <OptimizePromptSuggestion
                    state={optimize}
                    className="px-3 py-2"
                    markdownClassName="rounded-none border-0"
                    markdownBackgroundColor="transparent"
                  />
                ) : undefined
              }
            />
          ) : (
            <pre className="max-h-[260px] overflow-x-auto overflow-y-auto whitespace-pre rounded-md bg-muted px-4 py-3 text-xs font-mono leading-relaxed">
              {item.content}
            </pre>
          )}
        </section>
      )}

      {showFile && item.fileUrl && (
        <section>
          <SectionLabel>File</SectionLabel>
          {typeName === "image" ? (
            <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl!}
                alt={item.fileName ?? item.title}
                className="max-h-64 w-full object-contain"
              />
              {item.fileName && (
                <div className="flex items-center gap-2 border-t border-border px-3 py-2">
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {item.fileName}
                  </span>
                  {item.fileSize != null && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatBytes(item.fileSize)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${item.itemType.color}20` }}
              >
                <FileText
                  className="h-4 w-4"
                  style={{ color: item.itemType.color }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.fileName ?? "File"}
                </p>
                {item.fileSize != null && (
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(item.fileSize)}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {item.url && (
        <section>
          <SectionLabel>URL</SectionLabel>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm text-blue-400 hover:underline"
          >
            {item.url}
          </a>
        </section>
      )}

      {item.tags.length > 0 && (
        <section>
          <SectionLabel icon={<Tag className="h-3 w-3" />}>Tags</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {item.collections.length > 0 && (
        <section>
          <SectionLabel icon={<FolderOpen className="h-3 w-3" />}>
            Collections
          </SectionLabel>
          <div className="flex flex-col gap-1">
            {item.collections.map((collection) => (
              <span
                key={collection.id}
                className="text-sm text-muted-foreground"
              >
                {collection.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <ItemDetailsSection createdAt={item.createdAt} updatedAt={item.updatedAt} />
    </>
  );
}

function ItemDetailsSection({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  return (
    <section>
      <SectionLabel icon={<Calendar className="h-3 w-3" />}>Details</SectionLabel>
      <div className="flex flex-col gap-1">
        <DetailRow label="Created" value={formatLongDate(createdAt)} />
        <DetailRow label="Updated" value={formatLongDate(updatedAt)} />
      </div>
    </section>
  );
}

function EditInput({
  type,
  value,
  onChange,
  placeholder,
  accentColor,
}: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  accentColor: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:bg-muted/70"
      style={{ boxShadow: "none" }}
      onFocus={(e) =>
        (e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}20`)
      }
      onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
    />
  );
}

function EditTextarea({
  value,
  onChange,
  placeholder,
  accentColor,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  accentColor: string;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-md border border-border bg-muted/40 outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:bg-muted/70 resize-none ${className}`}
      style={{ boxShadow: "none" }}
      onFocus={(e) =>
        (e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}20`)
      }
      onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
    />
  );
}

export function ActionBtn({
  children,
  onClick,
  label,
  active,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 ${active ? "text-foreground" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionLabel({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/80">{value}</span>
    </div>
  );
}

export function DrawerSkeleton() {
  return (
    <div className="animate-pulse p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-muted" />
          <div className="h-5 w-40 rounded bg-muted" />
        </div>
        <div className="h-px bg-border" />
        <div className="flex gap-2">
          {[60, 50, 55].map((width) => (
            <div
              key={width}
              className="h-7 rounded-md bg-muted"
              style={{ width }}
            />
          ))}
        </div>
        <div className="h-px bg-border" />
        <div className="space-y-3 pt-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-16 rounded-md bg-muted" />
          <div className="mt-4 h-3 w-16 rounded bg-muted" />
          <div className="flex gap-1.5">
            {[40, 55, 45].map((width) => (
              <div
                key={width}
                className="h-5 rounded-full bg-muted"
                style={{ width }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
