import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ReportsService } from '../../../services/reports/reports.service';
import { Report } from '../../../domain/reports/report';
import { Router, ActivatedRoute } from '@angular/router';
import { ReportCriteria } from '../../../domain/reports/report-criteria';

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
        { targets: 0, name: 'description', width: '60%' },
        { targets: 1, name: 'type' },
        { targets: 2, name: 'actions', width: '20%', orderable: false }
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
    if (this.selectedData === data) {
      this.selectedData = null;
    } else {
      this.selectedData = data;
    }
    
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

  export(): void {
    this.reportsService.export(new ReportCriteria(), 'filename.csv').subscribe(
      response => {
        console.log('start download:', response);
        var url = window.URL.createObjectURL(response.data);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.download = response.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove(); // remove the element
      },
      error => {
        console.log('download error:', JSON.stringify(error));
      }, 
      () => {
        console.log('Completed file download.')
      }
    );
  }

}
