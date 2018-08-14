import { Component, OnInit } from '@angular/core';
import { TracesService } from '../../../../services/support/traces.service';
import { TraceCriteria } from '../../../../domain/support/trace-criteria';

@Component({
  selector: 'app-traces-list',
  templateUrl: './traces-list.component.html',
  styleUrls: ['./traces-list.component.css']
})
export class TracesListComponent implements OnInit {

  data: any[];

  constructor(private tracesService: TracesService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.tracesService.findByCriteria(new TraceCriteria()).subscribe(
      result => { this.data = result; },
      error => { console.error(error); }
    );
  }
}
