import { Observable } from 'rxjs/Rx';
import { environment } from '../../../../environments/environment';

/**
 * Class defining the common operations of the paginated data tables.
 */
export abstract class DataTablePagination {

  loading = true;

  data: any[];

  selectedItem: any;

  firstRow = 0;

  lastRow = 0;

  totalRows = 0;

  pageSize = environment.dataTable.pageSize;

  pageActual = 0;

  pageTotal = 0;

  sortField: String;

  sortOrder: String;

  /**
   * New instance of the class.
   * @param defaultSortField Default Sort field.
   * @param defaultSortOrder Default Sort order of sort field.
   */
  constructor(defaultSortField: String, defaultSortOrder: String) {
      this.sortField = defaultSortField;
      this.sortOrder = defaultSortOrder;
  }

  isLoading(): boolean {
    return this.loading;
  }

  reload(): void {
    this.loading = true;
    this.selectedItem = null;
    Observable.forkJoin([this.doCount(), this.doFilter()]).subscribe(
      results => {
        this.loading = false;
      },
      this.handlerError
    );
  }

  doFilter(): Observable<String> {
    this.handlerDoFilter().subscribe(
        values => {
          this.data = values;
        },
        this.handlerError
      );
    return Observable.of('DONE');
  }

    private updatePaginationInfo(): void {
        if ((this.totalRows % this.pageSize) === 0) {
            this.pageTotal = this.totalRows / this.pageSize;
        } else {
            this.pageTotal = Math.trunc((this.totalRows / this.pageSize) + 1);
        }

        this.firstRow = 1 + (this.pageActual * this.pageSize);
        if ((this.pageActual + 1) === this.pageTotal) {
            this.lastRow = this.totalRows;
        } else {
            this.lastRow = this.pageSize + (this.pageActual * this.pageSize);
        }
    }

  abstract handlerDoFilter(): Observable<any>;

  doCount(): Observable<String> {
    this.handlerDoCount().subscribe(
        result => {
          this.setTotalRows(result);
          this.updatePaginationInfo();
        },
        this.handlerError
      );
      return Observable.of('DONE');
  }

  abstract handlerDoCount(): Observable<number>;

  buildCriteria(): any {
      const criteria: any = this.handlerBuildCriteria();

      criteria.pageNumber = this.pageActual;
      criteria.pageSize = this.pageSize;
      criteria.sortField = this.sortField;
      criteria.sortOrder = this.sortOrder;

      return criteria;
  }

  abstract handlerBuildCriteria(): any;

  export(): void {
    this.handlerExport().subscribe(
      (result: Response) => {
        const file: Blob = new Blob([result.text()], {type: 'text/csv'});
        window.open(URL.createObjectURL(file));
      },
      this.handlerError
    );
  }

  abstract handlerExport(): Observable<any>;

  handlerError(error: any): void {
    // TODO Pendiente de Implementar
    console.error(error);
    alert(error);
  }

  setTotalRows(total: number): void {
    this.totalRows = total;
  }

  selectedRow(item: any): void {
    if (this.isSelected(item)) {
      this.selectedItem = null;
    } else {
      this.selectedItem = item;
    }
  }

  isSelected(item: any): boolean {
    return (this.selectedItem != null && this.selectedItem.id === item.id);
  }

  isSelectedItem(): boolean {
      return this.selectedItem != null;
  }

  previousPage(): void {
    if (this.pageActual > 0) {
        this.pageActual--;
    }
    this.reload();
  }

  page(page: number): void {
    this.pageActual = page--;
    this.reload();
  }

  nextPage(): void {
    if (this.pageActual < this.pageTotal) {
        this.pageActual++;
    }
    this.reload();
  }

  pages(): number[] {
    let pages: Array<number>;

    pages = new Array<number>();

    for (let i = 0; i < this.pageTotal; i++) {
        pages.push(i);
    }

      return pages;
  }

  isActualPage(page: number) {
    return this.pageActual === page;
  }

  isFirstPage(): boolean {
      return this.pageActual === 0;
  }

  isLastPage(): boolean {
    return (this.pageTotal === 0) || (this.pageActual === (this.pageTotal - 1));
  }

  short(field: String): void {
    if (this.sortField === undefined || this.sortField == null) {
      this.sortField = field;
      this.sortOrder = 'ASC';
    } else {
      if (this.sortField !== field) {
        this.sortField = field;
        this.sortOrder = 'ASC';
      } else {
        this.nextSortOrder();
      }
    }
    this.reload();
  }

  private nextSortOrder(): void {
    if (this.sortOrder === undefined || this.sortOrder == null) {
      this.sortOrder = 'ASC';
    } else if (this.sortOrder === 'ASC') {
      this.sortOrder = 'DESC';
    } else if (this.sortOrder === 'DESC') {
      this.sortOrder = null;
    }
  }

  isSortAsc(field: String): boolean {
    return (this.sortField !== null && this.sortField != null && this.sortField === field)
      &&
      (this.sortOrder !== undefined && this.sortOrder != null && this.sortOrder === 'ASC');
  }

  isSortDesc(field: String): boolean {
    return (this.sortField !== null && this.sortField != null && this.sortField === field)
    && (this.sortOrder !== undefined && this.sortOrder != null && this.sortOrder === 'DESC');
  }
}
