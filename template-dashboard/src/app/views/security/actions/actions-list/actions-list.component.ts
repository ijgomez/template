import { Component, OnInit } from '@angular/core';
import { ActionsService } from '../../../../services/security/actions.service';
import { ActionCriteria } from '../../../../domain/security/action-criteria';

@Component({
  selector: 'app-actions-list',
  templateUrl: './actions-list.component.html',
  styleUrls: ['./actions-list.component.scss']
})
export class ActionsListComponent implements OnInit {

  data: any[];

  constructor(private actionsService: ActionsService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.actionsService.findByCriteria(new ActionCriteria()).subscribe(
      result => { this.data = result; },
      error => { console.error(error); }
    );
  }

  delete(id: number): void {
    this.actionsService.read(id).subscribe(
    data => {
      this.actionsService.delete(data).subscribe(
        result => { this.loadData(); },
        error => { console.error(error); });
    },
    error => {
      console.error(error);
    });
  }

}
