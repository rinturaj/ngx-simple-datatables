import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  TrackByFunction,
  ViewChild,
  Inject,
  PLATFORM_ID,
  ContentChild,
  TemplateRef,
  AfterContentInit,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef as CDR,
} from "@angular/core";
import { ColumnConfig, SortState } from "../interfaces/column-config.interface";

@Component({
  selector: "ngx-simple-datatables",
  templateUrl: "./ngx-simple-datatables.component.html",
  styleUrls: ["./ngx-simple-datatables.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxSimpleDatatablesComponent
  implements OnInit, OnDestroy, AfterContentInit
{
  @Input() columns: ColumnConfig[] = [];
  @Input() data: any[] = [];
  @Input() rowHeight = 40;
  @Input() headerHeight = 50;
  @Input() bufferSize = 10;

  @ViewChild("tableContainer", { static: true })
  tableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild("tableBody", { static: true })
  tableBody!: ElementRef<HTMLDivElement>;
  @ViewChild("headerRow", { static: true })
  headerRow!: ElementRef<HTMLDivElement>;
  @ViewChild("headeCenterRow", { static: true })
  headeCenterRow!: ElementRef<HTMLDivElement>;

  @ContentChild("headerTemplate", { static: true })
  headerTemplate!: TemplateRef<any>;
  @ContentChild("cellTemplate", { static: true })
  cellTemplate!: TemplateRef<any>;

  // Virtualization properties
  visibleStartIndex = 0;
  visibleEndIndex = 0;
  visibleRows: any[] = [];
  totalHeight = 0;
  offsetY = 0;
  containerHeight = 0;

  // Column properties
  leftFrozenColumns: ColumnConfig[] = [];
  centerColumns: ColumnConfig[] = [];
  rightFrozenColumns: ColumnConfig[] = [];
  columnWidths: { [key: string]: number } = {};

  // Sorting
  sortState: SortState = { field: "", direction: null };

  // Resizing
  private isResizing = false;
  private resizingColumn = "";
  private startX = 0;
  private startWidth = 0;

  // Scroll listeners
  private scrollListener: ((event: Event) => void) | null = null;
  private resizeListener: ((event: Event) => void) | null = null;
  private isBrowser: boolean;
  private storageKey = "ngx-simple-datatables-column-widths";
  private scrollRequestId: number | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: ((e: MouseEvent) => void) | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.initializeColumns();
    if (this.isBrowser) {
      this.setupEventListeners();
    }
    this.calculateVirtualization();
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      this.removeEventListeners();

      // Clean up any pending animations or timeouts
      if (this.scrollRequestId) {
        cancelAnimationFrame(this.scrollRequestId);
      }

      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
    }
  }

  ngAfterContentInit() {
    // if (!this.headerTemplate) {
    //   throw new Error("ngx-simple-datatables requires a headerTemplate.");
    // }
    // if (!this.cellTemplate) {
    //   throw new Error("ngx-simple-datatables requires a cellTemplate.");
    // }
  }

  private initializeColumns() {
    this.leftFrozenColumns = this.columns.filter(
      (col) => col.freeze === "left"
    );
    this.rightFrozenColumns = this.columns.filter(
      (col) => col.freeze === "right"
    );
    this.centerColumns = this.columns.filter((col) => !col.freeze);

    // Load saved column widths if available
    const savedWidths = this.loadColumnWidths();

    // Initialize column widths
    this.columns.forEach((col) => {
      if (col.width) {
        this.columnWidths[col.field] = Number.parseInt(
          col.width.replace("px", "")
        );
      } else if (savedWidths && savedWidths[col.field]) {
        this.columnWidths[col.field] = savedWidths[col.field];
      } else {
        this.columnWidths[col.field] = 150; // default width
      }
    });
  }

  private setupEventListeners() {
    // Store references for cleanup
    this.scrollListener = (event: Event) => this.onBodyScroll(event);
    this.resizeListener = () => this.onResize();
    this.mouseMoveHandler = (event: MouseEvent) => this.onMouseMove(event);
    this.mouseUpHandler = (event: MouseEvent) => this.onMouseUp();

    // Add event listeners
    if (this.isBrowser) {
      // For the header scroll (horizontal only)
      if (this.headerRow?.nativeElement) {
        this.headerRow.nativeElement.addEventListener("scroll", () =>
          this.onHeaderScroll(null)
        );
      }

      // For the body scroll (both vertical and horizontal)
      if (this.tableBody?.nativeElement && this.scrollListener) {
        this.tableBody.nativeElement.addEventListener(
          "scroll",
          this.scrollListener
        );
      }

      // Window resize and mouse events
      if (this.resizeListener) {
        window.addEventListener("resize", this.resizeListener);
      }

      if (this.mouseMoveHandler) {
        document.addEventListener("mousemove", this.mouseMoveHandler);
      }

      if (this.mouseUpHandler) {
        document.addEventListener("mouseup", this.mouseUpHandler);
      }
    }
  }

  private removeEventListeners() {
    if (this.isBrowser) {
      // Clear any pending animations or timeouts
      if (this.scrollRequestId) {
        cancelAnimationFrame(this.scrollRequestId);
        this.scrollRequestId = null;
      }

      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = null;
      }

      // Reset all event listeners
      this.scrollListener = null;
      this.resizeListener = null;
      this.mouseMoveHandler = null;
      this.mouseUpHandler = null;
    }
  }

  private calculateVirtualization() {
    if (!this.tableContainer || !this.tableBody) return;

    // Update container height based on available space
    const container = this.tableBody.nativeElement;
    this.containerHeight = container.clientHeight - this.headerHeight;
    this.totalHeight = this.data.length * this.rowHeight;

    // Get scroll position
    const scrollTop = container.scrollTop;

    // Calculate visible rows
    const visibleRowCount =
      Math.ceil(this.containerHeight / this.rowHeight) + 1;

    // Calculate start and end indices with buffer
    this.visibleStartIndex = Math.max(
      0,
      Math.floor(scrollTop / this.rowHeight) - this.bufferSize
    );

    this.visibleEndIndex = Math.min(
      this.data.length - 1,
      this.visibleStartIndex + visibleRowCount + this.bufferSize * 2
    );

    // Update visible rows
    this.visibleRows = this.data.slice(
      this.visibleStartIndex,
      this.visibleEndIndex + 1
    );

    console.log(scrollTop, this.visibleStartIndex, this.visibleEndIndex);

    // Update vertical offset for virtual scrolling
    this.offsetY = this.visibleStartIndex * this.rowHeight;

    // Trigger change detection in the next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    Promise.resolve().then(() => {
      this.cdr.detectChanges();
    });
  }

  // Track last scroll time to prevent feedback loops
  private lastScrollTime = 0;
  private readonly SCROLL_DEBOUNCE = 10; // ms

  // Track scroll position for header transform
  public headerTransform = "translateX(0)";

  // Handle body scroll events
  public onBodyScroll(event: Event) {
    if (!event) return;

    const now = Date.now();
    if (now - this.lastScrollTime < this.SCROLL_DEBOUNCE) return;
    this.lastScrollTime = now;

    const target = event.target as HTMLElement;

    // Sync header scroll with body (horizontally)
    // if (this.headerRow?.nativeElement) {
    // this.headerRow.nativeElement.scrollLeft = target.scrollLeft;
    this.syncHorizontalScroll(target.scrollLeft);
    // }

    // Handle virtualization (vertical scrolling)
    if (this.scrollRequestId) {
      cancelAnimationFrame(this.scrollRequestId);
    }

    this.scrollRequestId = requestAnimationFrame(() => {
      this.calculateVirtualization();
      this.scrollRequestId = null;
    });
  }

  // Handle header scroll events
  public onHeaderScroll(event: Event | null): void {
    if (!event) return;
    const now = Date.now();
    if (now - this.lastScrollTime < this.SCROLL_DEBOUNCE) return;
    this.lastScrollTime = now;

    // Sync body scroll with header (horizontally)
    const scrollLeft = (event.target as HTMLElement).scrollLeft;
    if (this.tableBody?.nativeElement) {
      this.tableBody.nativeElement.scrollLeft = scrollLeft;
    }
  }

  private onResize() {
    // Debounce resize events for better performance
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = setTimeout(() => {
      this.calculateVirtualization();
      this.resizeTimer = null;
    }, 50);
  }

  private syncHorizontalScroll(scrollLeft: number) {
    if (!this.tableContainer) return;

    // Update the transform value
    this.headerTransform = `translateX(-${scrollLeft}px)`;
    // Trigger change detection
    this.cdr.detectChanges();
  }

  // Sorting functionality
  onSort(column: ColumnConfig) {
    if (!column.sortable) return;

    if (this.sortState.field === column.field) {
      // Toggle sort direction
      if (this.sortState.direction === "asc") {
        this.sortState.direction = "desc";
      } else if (this.sortState.direction === "desc") {
        this.sortState.direction = null;
        this.sortState.field = "";
      } else {
        this.sortState.direction = "asc";
      }
    } else {
      this.sortState.field = column.field;
      this.sortState.direction = "asc";
    }

    this.applySorting();
  }

  private applySorting() {
    if (!this.sortState.direction || !this.sortState.field) {
      // Reset to original order if no sorting
      return;
    }

    this.data.sort((a, b) => {
      const aValue = a[this.sortState.field];
      const bValue = b[this.sortState.field];

      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;

      return this.sortState.direction === "desc" ? -comparison : comparison;
    });

    this.calculateVirtualization();
  }

  getSortIcon(column: ColumnConfig): string {
    if (!column.sortable || this.sortState.field !== column.field) return "";
    if (this.sortState.direction === "asc") return "▲";
    if (this.sortState.direction === "desc") return "▼";
    return "";
  }

  // Column resizing functionality
  onResizeStart(event: MouseEvent, column: ColumnConfig) {
    event.preventDefault();
    this.isResizing = true;
    this.resizingColumn = column.field;
    this.startX = event.clientX;
    this.startWidth = this.columnWidths[column.field];

    if (this.isBrowser) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isResizing || !this.resizingColumn) return;

    this.ngZone.runOutsideAngular(() => {
      const deltaX = event.clientX - this.startX;
      const newWidth = Math.max(50, this.startWidth + deltaX); // Minimum width of 50px

      // Only update if width actually changed
      if (this.columnWidths[this.resizingColumn] !== newWidth) {
        this.columnWidths[this.resizingColumn] = newWidth;
        this.cdr.detectChanges();
      }
    });
  }

  private onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
      if (this.isBrowser) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        // Save column widths when resizing is complete
        this.saveColumnWidths();
      }
      this.resizingColumn = "";
    }
  }

  // Utility methods
  getColumnWidth(column: ColumnConfig): string {
    return `${this.columnWidths[column.field]}px`;
  }

  getCellValue(row: any, column: ColumnConfig): string {
    const value = row[column.field];
    return column.formatter
      ? column.formatter(value, row)
      : value?.toString() || "";
  }

  getLeftFrozenWidth(): number {
    return this.leftFrozenColumns.reduce(
      (sum, col) => sum + this.columnWidths[col.field],
      0
    );
  }

  getRightFrozenWidth(): number {
    return this.rightFrozenColumns.reduce(
      (sum, col) => sum + this.columnWidths[col.field],
      0
    );
  }

  // TrackBy functions for performance
  trackByRowIndex: TrackByFunction<any> = (index: number) =>
    this.visibleStartIndex + index;
  trackByColumnField: TrackByFunction<ColumnConfig> = (
    index: number,
    column: ColumnConfig
  ) => column.field;

  // Accessibility methods
  getAriaSort(column: ColumnConfig): string | null {
    if (this.sortState.field !== column.field || !column.sortable) {
      return null;
    }
    return this.sortState.direction === "asc" ? "ascending" : "descending";
  }

  // Keyboard navigation
  onKeydown(event: KeyboardEvent): void {
    if (!this.tableContainer) return;

    const { key, ctrlKey, shiftKey } = event;
    const scrollAmount = shiftKey ? 100 : 30; // Larger scroll with shift key
    console.log(key);
    switch (key) {
      case "ArrowLeft":
        this.tableContainer.nativeElement.scrollLeft -= scrollAmount;
        break;
      case "ArrowRight":
        this.tableContainer.nativeElement.scrollLeft += scrollAmount;
        break;
      case "ArrowUp":
        if (ctrlKey) {
          this.tableContainer.nativeElement.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        } else {
          this.tableContainer.nativeElement.scrollTop -= scrollAmount;
        }
        break;
      case "ArrowDown":
        if (ctrlKey) {
          this.tableContainer.nativeElement.scrollTo({
            top: this.tableContainer.nativeElement.scrollHeight,
            behavior: "smooth",
          });
        } else {
          this.tableContainer.nativeElement.scrollTop += scrollAmount;
        }
        break;
      case "1":
        if (ctrlKey) {
          this.tableContainer.nativeElement.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
          });
        } else {
          this.tableContainer.nativeElement.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        }
        break;
      case "0":
        if (ctrlKey) {
          this.tableContainer.nativeElement.scrollTo({
            top: this.tableContainer.nativeElement.scrollHeight,
            left: this.tableContainer.nativeElement.scrollWidth,
            behavior: "smooth",
          });
        } else {
          this.tableContainer.nativeElement.scrollTo({
            left: this.tableContainer.nativeElement.scrollWidth,
            behavior: "smooth",
          });
        }
        break;
      default:
        return; // Exit for other keys
    }

    event.preventDefault();
  }

  // Save column widths to localStorage
  private saveColumnWidths(): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify(this.columnWidths)
        );
      } catch (e) {
        console.warn("Failed to save column widths to localStorage", e);
      }
    }
  }

  // Load column widths from localStorage
  private loadColumnWidths(): Record<string, number> | null {
    if (!this.isBrowser) return null;

    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Failed to load column widths from localStorage", e);
      return null;
    }
  }

  // Clear saved column widths
  public clearSavedWidths(): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem(this.storageKey);
        // Reset to default widths
        this.columns.forEach((col) => {
          this.columnWidths[col.field] = col.width
            ? Number.parseInt(col.width.replace("px", ""))
            : 150;
        });
        this.cdr.detectChanges();
      } catch (e) {
        console.warn("Failed to clear saved column widths", e);
      }
    }
  }
}
