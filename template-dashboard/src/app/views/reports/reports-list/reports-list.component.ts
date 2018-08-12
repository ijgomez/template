import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.css']
})
export class ReportsListComponent implements OnInit {

  data: any[];

  constructor(private reportsService: ReportsService) { }

  ngOnInit() {
    this.data = [
      {id: 1, name: 'Report 1', description: 'Description of the report 1', format: 'xls'},
      {id: 2, name: 'Report 2', description: 'Description of the report 2', format: 'pdf'},
      {id: 3, name: 'Report 3', description: 'Description of the report 3', format: 'csv'},
      {id: 4, name: 'Report 4', description: 'Description of the report 4', format: 'xls'},
      {id: 5, name: 'Report 5', description: 'Description of the report 5', format: 'xls'}
    ];
  }

}
