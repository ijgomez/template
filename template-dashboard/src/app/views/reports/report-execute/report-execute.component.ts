import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-report-execute',
  templateUrl: './report-execute.component.html',
  styleUrls: ['./report-execute.component.scss']
})
export class ReportExecuteComponent implements OnInit {

  questions: any[];

  payLoad = '';

  constructor(
    private activeRoute: ActivatedRoute,
    private reportsService: ReportsService
  ) { }

  ngOnInit() {
    const id = this.activeRoute.snapshot.params['id'];
    this.reportsService.readReportParams(id).subscribe(result => {
      this.questions = result;
    });
  }

  onSubmit(form) {
    this.payLoad = JSON.stringify(form.value);
  }
}
