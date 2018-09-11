import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { ReportCriteria } from '../../../domain/reports/report-criteria';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss']
})
export class ReportsListComponent implements OnInit, AfterViewInit, OnDestroy {
  

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtOptions: DataTables.Settings = {};

  dtTrigger: Subject<any> = new Subject();

  data: any[];

  constructor(private reportsService: ReportsService) { }

  ngOnInit() {
    const that = this;

    this.dtOptions = {
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback) => {
        that.reportsService.table(dataTablesParameters).subscribe(response => {
          this.data = response.data;

          callback({
            recordsTotal: response.recordsTotal,
            recordsFiltered: response.recordsFiltered,
            data: []
          });
        });
      }
    };
  } 

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  loadData() {
    this.reportsService.findByCriteria(new ReportCriteria()).subscribe(
      result => { 
        this.data = result; 
      },
      error => { console.error(error); }
    );
  }

  reload(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }

  delete(id: number): void {
    this.reportsService.read(id).subscribe(
    data => {
      this.reportsService.delete(data).subscribe(
        result => { this.reload(); },
        error => { console.error(error); });
    },
    error => {
      console.error(error);
    });
  }

}
