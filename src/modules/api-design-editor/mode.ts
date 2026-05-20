export const EDITOR_MODES = ['canvas', 'flat'] as const
export type EditorMode = (typeof EDITOR_MODES)[number]

export const FLAT_TABS = ['resources', 'schemas', 'auth-schemes'] as const
export type FlatTab = (typeof FLAT_TABS)[number]

export const DEFAULT_EDITOR_MODE: EditorMode = 'canvas'
export const DEFAULT_FLAT_TAB: FlatTab = 'resources'

export function parseEditorMode(value: string | null | undefined): EditorMode {
  return EDITOR_MODES.includes(value as EditorMode)
    ? (value as EditorMode)
    : DEFAULT_EDITOR_MODE
}

export function parseFlatTab(value: string | null | undefined): FlatTab {
  return FLAT_TABS.includes(value as FlatTab)
    ? (value as FlatTab)
    : DEFAULT_FLAT_TAB
}
