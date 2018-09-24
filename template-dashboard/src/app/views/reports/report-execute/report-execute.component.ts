import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MessageComponent } from '../../components/modal/message/message.component';
import { saveAs } from 'file-saver/FileSaver';

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
    private reportsService: ReportsService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    const id = this.activeRoute.snapshot.params['id'];
    this.reportsService.readReportParams(id).subscribe(result => {
      this.questions = result;
    });
  }

  onSubmit(form) {
    const id = this.activeRoute.snapshot.params['id'];
    this.payLoad = JSON.stringify(form.value);
    this.reportsService.execute(id, this.payLoad).subscribe(
      response => {
        console.log('start download:', response);
        const blob = response.blob();
        const file = new Blob([blob], {});
        const filename = 'report-' + Date.now() + '.pdf';
        saveAs(file, filename);
        //var url= window.URL.createObjectURL(blob);
        //window.open(url);
      },
      error => {
        this.showError(error);
      },
      () => {
        console.log('Completed file download.');
      }
    );
  }

  showError(error) {
    console.log('error');
    console.log(error);

    const modalRef = this.modalService.open(MessageComponent, { centered: true });
    modalRef.componentInstance.title = 'Alert!';
    modalRef.componentInstance.message = error.json().message;
    modalRef.componentInstance.details = error.json().details;

  }
}
