import { Component, OnInit } from '@angular/core';
import { ReportCriteria } from 'src/app/core/models/reports/report-criteria.model';
import { ReportService } from '../../../core/services/reports/report.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  data: any[] | undefined;

  constructor(private reportService: ReportService) { }

  ngOnInit(): void {
    this.reportService.findByCriteria(new ReportCriteria()).subscribe(
      result => {
        this.data = result;
      },
      error => {
        console.error(error);
      }
    );
  }

}
