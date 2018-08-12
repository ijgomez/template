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
    this.reportsService.findByCriteria(new ReportCriteria()).subscribe(value => { this.data = value; });
  }

}
