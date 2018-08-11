import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { FormGroup, FormControl, Validators, FormBuilder } from '../../../../../node_modules/@angular/forms';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  reportForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private reportsService: ReportsService) { }

  ngOnInit() {
    this.reportForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  onSubmit() {
    console.warn(this.reportForm.value);
  }
}
