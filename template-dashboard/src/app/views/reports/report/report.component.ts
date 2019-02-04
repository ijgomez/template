import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { FormGroup, Validators, FormBuilder, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Report } from '../../../domain/reports/report';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmComponent } from '../../components/modal/confirm/confirm.component';
import { MessageComponent } from '../../components/modal/message/message.component';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  reportForm: FormGroup;

  constructor(
    private activeRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private location: Location,
    private modalService: NgbModal,
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
      name: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.required],
      archive: ['',[Validators.required]]
    });
  }

   // convenience getter for easy access to form fields
   get formControls() { return this.reportForm.controls; }

  isEdit(): Boolean {
    const id = this.activeRoute.snapshot.params['id'];
    return (id !== undefined);
  }

  loadData() {
    const id = this.activeRoute.snapshot.params['id'];
    this.reportsService.read(id).subscribe(report => {
      console.log(report);
      this.reportForm.setValue({
        name: report.name,
        description: report.description,
        archive: report.archive // TODO Pendiente de cargar el fichero.
      });
    });
  }

  onSubmit() {
    const report: Report = this.reportForm.value;
    let result: Observable<number>;
    console.warn(report);
    if (this.isEdit()) {
      report.id = Number(this.activeRoute.snapshot.params['id']);
      result = this.reportsService.update(report);
    } else {
      result = this.reportsService.create(report);
    }
    result.subscribe(
      response => {
        const modalRef = this.modalService.open(MessageComponent, { centered: true });
        modalRef.componentInstance.title = 'Info';
        modalRef.componentInstance.message = response;
        modalRef.result.then(
          (re) => { 
            this.location.back();
          },
          (reason) => {console.log(reason) }
        );
      },
      error => { console.error(error); }
    );
  }

  onFileChange(event) {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);

      reader.onload = () => {
        this.reportForm.get('archive').setValue({
          filename: file.name,
          filetype: file.type,
          value: reader.result.toString().split(',')[1],
          size: file.size 
        });

        // need to run CD since file load runs outside of zone
        this.cd.markForCheck();
      };
    }
  }

  download() {
    // TODO Pending
  }
}
