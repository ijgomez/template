import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ReportsService } from '../../../services/reports/reports.service';
import { Report } from '../../../domain/reports/report';
import { Router, ActivatedRoute } from '@angular/router';
import { ReportCriteria } from '../../../domain/reports/report-criteria';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmComponent } from '../../components/modal/confirm/confirm.component';
import { MessageComponent } from '../../components/modal/message/message.component';
import { saveAs } from 'file-saver/FileSaver';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss']
})
export class ReportsListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtOptions: DataTables.Settings = {};

  dtTrigger: Subject<any> = new Subject();

  data: any[];

  selectedData: any;

  constructor(
      private router: Router, 
      private activeRoute:ActivatedRoute,  
      private modalService: NgbModal, 
      private reportsService: ReportsService
    ) { }

  ngOnInit() {
    const that = this;

    this.dtOptions = {
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      columnDefs: [
        { targets: 0, name: 'description', width: '70%' },
        { targets: 1, name: 'type' },
        { targets: 2, name: 'actions', width: '10%', orderable: false }
      ],
      ajax: (dataTablesParameters: any, callback) => {
        that.reportsService.table(dataTablesParameters).subscribe(response => {
          this.data = response.data;

          callback({
            recordsTotal: response.recordsTotal,
            recordsFiltered: response.recordsFiltered,
            data: []
          });
        });
      }  
    };
  } 

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  selectedItem(data: any): void {
    if (this.selectedData === data) {
      this.selectedData = null;
    } else {
      this.selectedData = data;
    }
    
  }

  isSelectedItem(): Boolean {
    return !(this.selectedData == undefined || this.selectedData == null);
  }

  reload(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }

  edit(): void {
    var report: Report = this.selectedData;
    this.router.navigate(['edit', report.id], { relativeTo: this.activeRoute });
  }
 

  delete(): void {
    var report: Report = this.selectedData;
    this.reportsService.read(report.id).subscribe(
    data => {
      const modalRef = this.modalService.open(ConfirmComponent, { centered: true });
      modalRef.componentInstance.message = 'Are you sure you want to delete the ' + report.name + '?';
      modalRef.result.then(
        r => {
          this.reportsService.delete(data).subscribe(
            result => { 
              this.selectedData = null;
              modalRef.close();
              this.reload(); 
            },
            error => { console.error(error); }
          );
        },
        c => { console.log(c)}
      );
    },
    error => {
      console.error(error);
    });
  }

  export(): void {
    this.reportsService.export(new ReportCriteria()).subscribe(
      response => {
         // get the response as blob, rename the file, and save  it
      const blob = response.blob();
      const file = new Blob([blob], {});
      const filename = 'export-' + Date.now() + '.csv';
      saveAs(file, filename);
      },
      error => {
        this.showError(error);
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
