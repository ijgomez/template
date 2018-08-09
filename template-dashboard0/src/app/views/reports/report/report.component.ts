import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Report } from '../../../domain/reports/report';
import { FormGroup, NgModel } from '@angular/forms';
import { ReportsService } from '../../../services/reports/reports.service';
import { Observable } from 'rxjs/Rx';
import { ActiveModal } from '../../components/modal/modal-ref';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  @Input()
  report: Report;

  @ViewChild('frm')
  formGroup: FormGroup;

  private fileReader: FileReader;

  private archive: Blob;

  constructor(public activeModal: ActiveModal, private reportsService: ReportsService) { }

  ngOnInit() {
    if (this.report == null) {
      this.report = new Report();
    }

    this.fileReader = new FileReader();
    this.fileReader.onloadstart = function(e: ProgressEvent) { console.log('onloadstart... ' + e.loaded + '-' + e.total); };
    this.fileReader.onprogress  = function(e: ProgressEvent) { console.log('onprogress... ' + e.loaded + '-' + e.total); };
    this.fileReader.onloadend   = function(e: ProgressEvent) { console.log('onloadend... ' + e.loaded + '-' + e.total); };
    //this.fileReader.onerror = function(e: ErrorEvent) { console.log('onerror... ' + e); };
    this.fileReader.onload = (e) => {
      let fileContent: String, fileData: string, fileType: any;

      // this.report.archive = this.fileReader.result;
      fileContent = this.fileReader.result;
      fileData = fileContent.split(',')[1];
      fileType = fileContent.split('.')[0].split(';')[0].split(':')[1];

      this.archive = new Blob([atob(fileData)], { type: fileType});
    };

  }

  isNewReport(): Boolean {
    return (this.report.id == null);
  }

  fileChangeEvent($event): void {
    let files: File[];
    let file: File;

    files = $event.target.files;
    if (files.length === 1) {
      file = files[0];
      console.log('file: ' + file.name);
      this.fileReader.readAsDataURL(file);
    } else {
      this.handlerError('Too many files');
    }
  }

  save(): void {
    try {
      let result: Observable<number>;
      console.log(this.report);
      if (this.report.id === undefined) {
        result = this.reportsService.create(this.report);
      } else {
        result = this.reportsService.update(this.report);
      }
      result.subscribe(
        response => {
          console.log(response);
          this.activeModal.close(this.report);
        },
        error => { this.handlerError(error); }
      );
      // this.formGroup.reset();
    } catch (e) {
      this.handlerError(e);
    }
  }

  close(): void {
    this.activeModal.close('Close click');
  }

  dismiss(): void {
    this.activeModal.dismiss('Cross click');
  }

  hasErrors(ngModel: NgModel): boolean {
    return ngModel.invalid && (ngModel.dirty || ngModel.touched);
  }

  handlerError(e) {
    console.error(e);
    // TODO Pendiente de Implementar.
  }

}
