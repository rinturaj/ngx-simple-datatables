import {
  Component,
  Input,
  type OnInit,
  type OnDestroy,
  type ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  type ChangeDetectorRef,
  type TrackByFunction,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import type { ColumnConfig, SortState } from "../interfaces/column-config.interface"

@Component({
  selector: "lib-dynamic-table",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./dynamic-table.component.html",
  styleUrls: ["./dynamic-table.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicTableComponent implements OnInit, OnDestroy {
  @Input() columns: ColumnConfig[] = []
  @Input() data: any[] = []
  @Input() rowHeight = 40
  @Input() headerHeight = 50
  @Input() bufferSize = 10

  @ViewChild("tableContainer", { static: true }) tableContainer!: ElementRef<HTMLDivElement>
  @ViewChild("tableBody", { static: true }) tableBody!: ElementRef<HTMLDivElement>
  @ViewChild("headerRow", { static: true }) headerRow!: ElementRef<HTMLDivElement>

  // Virtualization properties
  visibleStartIndex = 0
  visibleEndIndex = 0
  visibleRows: any[] = []
  totalHeight = 0
  offsetY = 0
  containerHeight = 0

  // Column properties
  leftFrozenColumns: ColumnConfig[] = []
  centerColumns: ColumnConfig[] = []
  rightFrozenColumns: ColumnConfig[] = []
  columnWidths: { [key: string]: number } = {}

  // Sorting
  sortState: SortState = { field: "", direction: null }

  // Resizing
  private isResizing = false
  private resizingColumn = ""
  private startX = 0
  private startWidth = 0

  // Scroll listeners
  private scrollListener?: () => void
  private resizeListener?: () => void

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeColumns()
    this.setupEventListeners()
    this.calculateVirtualization()
  }

  ngOnDestroy() {
    this.removeEventListeners()
  }

  private initializeColumns() {
    this.leftFrozenColumns = this.columns.filter((col) => col.freeze === "left")
    this.rightFrozenColumns = this.columns.filter((col) => col.freeze === "right")
    this.centerColumns = this.columns.filter((col) => !col.freeze)

    // Initialize column widths
    this.columns.forEach((col) => {
      if (col.width) {
        this.columnWidths[col.field] = Number.parseInt(col.width.replace("px", ""))
      } else {
        this.columnWidths[col.field] = 150 // default width
      }
    })
  }

  private setupEventListeners() {
    this.scrollListener = () => this.onScroll()
    this.resizeListener = () => this.onResize()

    if (this.tableContainer) {
      this.tableContainer.nativeElement.addEventListener("scroll", this.scrollListener)
    }
    window.addEventListener("resize", this.resizeListener)
    document.addEventListener("mousemove", this.onMouseMove.bind(this))
    document.addEventListener("mouseup", this.onMouseUp.bind(this))
  }

  private removeEventListeners() {
    if (this.scrollListener && this.tableContainer) {
      this.tableContainer.nativeElement.removeEventListener("scroll", this.scrollListener)
    }
    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener)
    }
    document.removeEventListener("mousemove", this.onMouseMove.bind(this))
    document.removeEventListener("mouseup", this.onMouseUp.bind(this))
  }

  private calculateVirtualization() {
    if (!this.tableContainer) return

    this.containerHeight = this.tableContainer.nativeElement.clientHeight - this.headerHeight
    this.totalHeight = this.data.length * this.rowHeight

    const scrollTop = this.tableContainer.nativeElement.scrollTop
    const visibleRowCount = Math.ceil(this.containerHeight / this.rowHeight)

    this.visibleStartIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.bufferSize)
    this.visibleEndIndex = Math.min(
      this.data.length - 1,
      this.visibleStartIndex + visibleRowCount + this.bufferSize * 2,
    )

    this.visibleRows = this.data.slice(this.visibleStartIndex, this.visibleEndIndex + 1)
    this.offsetY = this.visibleStartIndex * this.rowHeight

    this.cdr.detectChanges()
  }

  private onScroll() {
    this.calculateVirtualization()
    this.syncHorizontalScroll()
  }

  private onResize() {
    this.calculateVirtualization()
  }

  private syncHorizontalScroll() {
    if (!this.tableContainer || !this.headerRow) return

    const scrollLeft = this.tableContainer.nativeElement.scrollLeft
    this.headerRow.nativeElement.style.transform = `translateX(-${scrollLeft}px)`
  }

  // Sorting functionality
  onSort(column: ColumnConfig) {
    if (!column.sortable) return

    if (this.sortState.field === column.field) {
      // Toggle sort direction
      if (this.sortState.direction === "asc") {
        this.sortState.direction = "desc"
      } else if (this.sortState.direction === "desc") {
        this.sortState.direction = null
        this.sortState.field = ""
      } else {
        this.sortState.direction = "asc"
      }
    } else {
      this.sortState.field = column.field
      this.sortState.direction = "asc"
    }

    this.applySorting()
  }

  private applySorting() {
    if (!this.sortState.direction || !this.sortState.field) {
      // Reset to original order if no sorting
      return
    }

    this.data.sort((a, b) => {
      const aValue = a[this.sortState.field]
      const bValue = b[this.sortState.field]

      let comparison = 0
      if (aValue > bValue) comparison = 1
      if (aValue < bValue) comparison = -1

      return this.sortState.direction === "desc" ? -comparison : comparison
    })

    this.calculateVirtualization()
  }

  getSortIcon(column: ColumnConfig): string {
    if (!column.sortable || this.sortState.field !== column.field) return ""
    if (this.sortState.direction === "asc") return "▲"
    if (this.sortState.direction === "desc") return "▼"
    return ""
  }

  // Column resizing functionality
  onResizeStart(event: MouseEvent, column: ColumnConfig) {
    event.preventDefault()
    this.isResizing = true
    this.resizingColumn = column.field
    this.startX = event.clientX
    this.startWidth = this.columnWidths[column.field]

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isResizing || !this.resizingColumn) return

    const deltaX = event.clientX - this.startX
    const newWidth = Math.max(50, this.startWidth + deltaX) // Minimum width of 50px

    this.columnWidths[this.resizingColumn] = newWidth
    this.cdr.detectChanges()
  }

  private onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false
      this.resizingColumn = ""
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }

  // Utility methods
  getColumnWidth(column: ColumnConfig): string {
    return `${this.columnWidths[column.field]}px`
  }

  getCellValue(row: any, column: ColumnConfig): string {
    const value = row[column.field]
    return column.formatter ? column.formatter(value, row) : value?.toString() || ""
  }

  getLeftFrozenWidth(): number {
    return this.leftFrozenColumns.reduce((sum, col) => sum + this.columnWidths[col.field], 0)
  }

  getRightFrozenWidth(): number {
    return this.rightFrozenColumns.reduce((sum, col) => sum + this.columnWidths[col.field], 0)
  }

  // TrackBy functions for performance
  trackByRowIndex: TrackByFunction<any> = (index: number) => this.visibleStartIndex + index
  trackByColumnField: TrackByFunction<ColumnConfig> = (index: number, column: ColumnConfig) => column.field
}
