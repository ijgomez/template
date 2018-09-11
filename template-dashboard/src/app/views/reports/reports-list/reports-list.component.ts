import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { ReportCriteria } from '../../../domain/reports/report-criteria';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss']
})
export class ReportsListComponent implements OnInit, OnDestroy {

  dtOptions: DataTables.Settings = {};

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

  ngOnDestroy(): void {

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
