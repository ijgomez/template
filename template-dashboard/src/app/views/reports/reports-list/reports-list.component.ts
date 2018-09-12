import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ReportsService } from '../../../services/reports/reports.service';
import { Report } from '../../../domain/reports/report';
import { Router, ActivatedRoute } from '@angular/router';

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

  selectedData: any;

  constructor(private router: Router, private activeRoute:ActivatedRoute, private reportsService: ReportsService) { }

  ngOnInit() {
    const that = this;

    this.dtOptions = {
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      columnDefs: [
        { width: '60%', targets: 0, name: 'description' },
        { targets: 1, name: 'type' },
        { width: '20%', targets: 2, orderable: false }
      ],
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

  selectedItem(data: any): void {
    this.selectedData = data;
  }

  isSelectedItem(): Boolean {
    return !(this.selectedData == undefined || this.selectedData == null);
  }

  reload(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }

  edit(): void {
    var report: Report = this.selectedData;
    this.router.navigate(['edit', report.id], { relativeTo: this.activeRoute });
  }
 

  delete(): void {
    var report: Report = this.selectedData;
    this.reportsService.read(report.id).subscribe(
    data => {
      this.reportsService.delete(data).subscribe(
        result => { this.reload(); },
        error => { console.error(error); });
    },
    error => {
      console.error(error);
    });
  }

  export() {
    
  }

}
