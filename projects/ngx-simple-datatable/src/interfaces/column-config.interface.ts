export interface ColumnConfig {
  field: string
  header: string
  width?: string
  freeze?: "left" | "right"
  sortable?: boolean
  formatter?: (value: any, row: any) => string
}

export interface SortState {
  field: string
  direction: "asc" | "desc" | null
}
