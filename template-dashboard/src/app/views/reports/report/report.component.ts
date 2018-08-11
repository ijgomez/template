import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { FormGroup, Validators, FormBuilder } from '../../../../../node_modules/@angular/forms';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  reportForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private cd: ChangeDetectorRef, private reportsService: ReportsService) { }

  ngOnInit() {
    this.reportForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  onSubmit() {
    console.warn(this.reportForm.value);
  }

  onFileChange(event) {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);

      reader.onload = () => {
        this.reportForm.patchValue({
          file: reader.result
       });

        // need to run CD since file load runs outside of zone
        this.cd.markForCheck();
      };
    }
  }
}
