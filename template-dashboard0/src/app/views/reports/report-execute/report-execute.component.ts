import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Report } from '../../../domain/reports/report';
import { ActiveModal } from '../../components/modal/modal.module';
import { FormGroup } from '@angular/forms';
import { ReportsService } from '../../../services/reports/reports.service';

@Component({
  selector: 'app-report-execute',
  templateUrl: './report-execute.component.html',
  styleUrls: ['./report-execute.component.css']
})
export class ReportExecuteComponent implements OnInit {

  @Input()
  report: Report;

  @ViewChild('frm')
  formGroup: FormGroup;

  constructor(public activeModal: ActiveModal, private reportsService: ReportsService) { }

  ngOnInit() {
  }

  close(): void {
    this.activeModal.close('Close click');
  }

  dismiss(): void {
    this.activeModal.dismiss('Cross click');
  }

  execute(): void {
  }
}
