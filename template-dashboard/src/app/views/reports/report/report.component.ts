import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  constructor(private reportsService: ReportsService) { }

  ngOnInit() {
  }

}
