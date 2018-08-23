import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { ReportCriteria } from '../../../domain/reports/report-criteria';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.css']
})
export class ReportsListComponent implements OnInit {

  data: any[];

  constructor(private reportsService: ReportsService) { }

  ngOnInit() {
   this.loadData();
  }

  loadData() {
    this.reportsService.findByCriteria(new ReportCriteria()).subscribe(
      result => { this.data = result; },
      error => { console.error(error); }
    );
  }

  delete(id: number): void {
    this.reportsService.read(id).subscribe(
    data => {
      this.reportsService.delete(data).subscribe(
        result => { this.loadData(); },
        error => { console.error(error); });
    },
    error => {
      console.error(error);
    });
  }

}
