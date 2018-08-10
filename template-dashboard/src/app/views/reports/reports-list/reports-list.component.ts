import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.css']
})
export class ReportsListComponent implements OnInit {

  constructor(private reportsService: ReportsService) { }

  ngOnInit() {
  }

}
