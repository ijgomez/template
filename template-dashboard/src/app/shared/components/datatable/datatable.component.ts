import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent implements AfterViewInit, OnInit, OnDestroy {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective | undefined;
  
  @Output()
  selectedEvent:EventEmitter<any> = new EventEmitter<any>();

  @Output()
  dbClickEvent:EventEmitter<any> = new EventEmitter<any>();


  _dtOptions: DataTables.Settings = {};

  dtTrigger: Subject<any> = new Subject<any>();

  private rowSelected: any;

  constructor(private translate: TranslateService) { }
 
  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  
  }
  
  get dtOptions(): DataTables.Settings {
    return this._dtOptions;
  }

  @Input()
  set dtOptions(value: DataTables.Settings) {
    console.log(this.translate.defaultLang);

    value.pagingType = 'full_numbers';
    value.searching = false;
    value.lengthChange = false;
    value.pageLength = environment.datatable_pageLength;
    value.serverSide = true;
    value.processing = true;
    value.language = {
      url: "/assets/i18n/dataTables." + this.translate.currentLang + ".json"
    };
    value.rowCallback = (row: Node, data: any[] | Object, index: number) => {

      // Unbind first in order to avoid any duplicate handler (see https://github.com/l-lin/angular-datatables/issues/87)
      // Note: In newer jQuery v3 versions, `unbind` and `bind` are deprecated in favor of `off` and `on`
      $('td', row).off('click');
      $('td', row).on('click', () => {
        this.changeRowSelected($('td', row));
        this.notifyClickSelected(data);
      });

      $('td', row).off('dblclick');
      $('td', row).on('dblclick', () => {
        this.changeRowSelected($('td', row));
        this.notifyDbClickSelected(data);
      });
      
      return row;
    }
    this._dtOptions = value;
  }

  reload(): void {
    this.dtElement?.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      //dtInstance.destroy();
      // Call the dtTrigger to rerender again
      //this.dtTrigger.next();

      dtInstance.ajax.reload();
    });
  }

  private notifyClickSelected(data: any): void {
    this.selectedEvent.emit(data);
  }

  private notifyDbClickSelected(data: any): void {
    this.dbClickEvent.emit(data);
  }

  private changeRowSelected(row: any): void {
    if (this.rowSelected != undefined) {
      this.rowSelected.removeClass('table-secondary');
    }
    this.rowSelected = row;
    this.rowSelected.addClass('table-secondary');
  }

}
