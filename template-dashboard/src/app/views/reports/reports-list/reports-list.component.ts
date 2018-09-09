import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { ReportCriteria } from '../../../domain/reports/report-criteria';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss']
})
export class ReportsListComponent implements OnInit, OnDestroy {

  dtOptions: DataTables.Settings = {};

  data: any[];

  dtTrigger: Subject<any> = new Subject();

  constructor(private reportsService: ReportsService) { }

  ngOnInit() {
    this.dtOptions = {
      pagingType: 'full_numbers'
    };
   this.loadData();
  } 

  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  loadData() {
    this.reportsService.findByCriteria(new ReportCriteria()).subscribe(
      result => { 
        this.data = result; 
        this.dtTrigger.next();
      },
      error => { console.error(error); }
    );
  }

  reload(): void {
    this.loadData();
  }

  delete(id: number): void {
    this.reportsService.read(id).subscribe(
    data => {
      this.reportsService.delete(data).subscribe(
        result => { this.loadData(); },
        error => { console.error(error); });
    },
    error => {
      console.error(error);
    });
  }

}
