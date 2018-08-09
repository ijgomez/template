import { Component, OnInit } from '@angular/core';
import { TracesService } from '../../../../services/support/traces.service';
import { DataTablePagination } from '../../../components/datatable/datatable-pagination.component';
import { Observable } from 'rxjs/Rx';
import { TraceCriteria } from '../../../../domain/support/trace-criteria';

@Component({
  selector: 'app-traces-list',
  templateUrl: './traces-list.component.html',
  styleUrls: ['./traces-list.component.css']
})
export class TracesListComponent extends DataTablePagination implements OnInit {

  constructor(private tracesService: TracesService) {
    super('message', 'ASC');
  }

  ngOnInit() {
    this.reload();
  }

  handlerDoFilter(): Observable<any> {
    return this.tracesService.findByCriteria(this.buildCriteria());
  }

  handlerDoCount(): Observable<number> {
    return this.tracesService.countByCriteria(this.buildCriteria());
  }

  handlerBuildCriteria() {
    let criteria: TraceCriteria;

    criteria = new TraceCriteria();
    // TODO Pendiente de Implementar
    return criteria;
  }

  handlerExport(): Observable<any> {
    return this.tracesService.export(this.buildCriteria());
   }

}
