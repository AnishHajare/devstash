/**
 * Shared item-type classification constants.
 * These are used across actions, dialogs, and the item drawer.
 */

/** System types that require a Pro subscription. */
export const PRO_SYSTEM_TYPES: string[] = ["File", "Image"];

/** Type names whose items store text/markdown content. */
export const TEXT_CONTENT_TYPES: string[] = ["snippet", "prompt", "command", "note"];

/** Type names that expose a language selector. */
export const LANGUAGE_TYPES: string[] = ["snippet", "command"];

/** Type names whose content is rendered as Markdown. */
export const MARKDOWN_TYPES: string[] = ["note", "prompt"];
