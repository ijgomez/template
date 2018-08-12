import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '../../../../../node_modules/@angular/forms';
import { ReportsService } from '../../../services/reports/reports.service';

@Component({
  selector: 'app-report-execute',
  templateUrl: './report-execute.component.html',
  styleUrls: ['./report-execute.component.css']
})
export class ReportExecuteComponent implements OnInit {

  reportExecuteForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private cd: ChangeDetectorRef, private reportsService: ReportsService) { }

  ngOnInit() {
    this.reportExecuteForm = this.formBuilder.group({});
  }

  onSubmit() {
    console.warn(this.reportExecuteForm.value);
  }
}
