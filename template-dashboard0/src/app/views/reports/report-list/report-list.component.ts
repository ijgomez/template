import { Component, OnInit } from '@angular/core';
import { DataTablePagination } from '../../components/datatable/datatable-pagination.component';
import { Observable } from 'rxjs/Rx';
import { ReportsService } from '../../../services/reports/reports.service';
import { ReportCriteria } from '../../../domain/reports/report-criteria';
import { Report } from '../../../domain/reports/report';
import { ReportComponent } from '../report/report.component';
import { ModalOptions } from '../../components/modal/modal-options';
import { ModalRef } from '../../components/modal/modal-ref';
import { Modal } from '../../components/modal/modal';
import { ReportExecuteComponent } from '../report-execute/report-execute.component';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.css']
})
export class ReportListComponent extends DataTablePagination implements OnInit {

  private options: ModalOptions = { size: 'lg'};

  constructor(private reportsService: ReportsService, private modalService: Modal) {
    super('name', 'ASC');
  }

  ngOnInit() {
    this.reload();
  }

  handlerDoFilter(): Observable<any> {
    return this.reportsService.findByCriteria(this.buildCriteria());
  }

  handlerDoCount(): Observable<number> {
    return this.reportsService.countByCriteria(this.buildCriteria());
  }

  handlerBuildCriteria(): any {
    let criteria: ReportCriteria;

    criteria = new ReportCriteria();
    // TODO Pendiente de Implementar
    return criteria;
  }

  handlerExport(): Observable<any> {
   return this.reportsService.export(this.buildCriteria());
  }

  add(): void {
    const modal: ModalRef = this.modalService.open(ReportComponent, this.options);
    modal.result.then(
      (result) => {
        this.reload();
      },
      (reason) => { }
    );
  }

  update(report: Report): void {
    let id: number;
    if (report == null) {
      id = this.selectedItem.id;
    } else {
      this.selectedRow(report);
      id = report.id;
    }
    this.reportsService.read(id).subscribe(
      response => {
        this.selectedItem = null;
        const modal: ModalRef = this.modalService.open(ReportComponent, this.options);
        (<ReportComponent>modal.componentInstance).report = response;
        modal.result.then(
          (result) => {
            this.reload();
          },
          (reason) => { }
        );
      },
      this.handlerError
    );

  }

  delete(report: Report): void {
    const modal: ModalRef = this.modalService.confirm('Report Delete', 'Delete the report. Are you sure?');
    modal.result.then(
      (result) => {
        this.reportsService.delete(this.selectedItem).subscribe(
          response => {
            this.reload();
          },
          this.handlerError
        );
        this.selectedItem = null;
      },
      (reason) => {
        console.log('execute: reason');
       }
    );
  }

  execute(report: Report): void {
    this.reportsService.read(report.id).subscribe(
      response => {
        this.selectedItem = null;
        const modal: ModalRef = this.modalService.open(ReportExecuteComponent, this.options);
        (<ReportExecuteComponent>modal.componentInstance).report = response;
        modal.result.then(
          (result) => {
            this.reload();
          },
          (reason) => { }
        );
      },
      this.handlerError
    );
  }
}
