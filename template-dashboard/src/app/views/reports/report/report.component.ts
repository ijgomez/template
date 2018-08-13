import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  reportForm: FormGroup;

  constructor(
    private activeRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private reportsService: ReportsService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.isEdit()) {
      this.loadData();
    }
  }

  initForm() {
    this.reportForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  isEdit(): Boolean {
    const id = this.activeRoute.snapshot.params['id'];
    return (id !== undefined);
  }

  loadData() {
    const id = this.activeRoute.snapshot.params['id'];
    this.reportsService.read(id).subscribe(r => {
      this.reportForm.setValue({
        name: r.name,
        description: r.description,
        file: null // TODO Pendiente de cargar el fichero.
      });
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
