import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ActionCriteria } from 'src/app/core/models/security/action-criteria.model';
import { Action } from 'src/app/core/models/security/action.model';
import { ActionService } from 'src/app/core/services/security/action.service';

@Component({
  selector: 'app-action-select',
  templateUrl: './action-select.component.html',
  styleUrls: ['./action-select.component.scss']
})
export class ActionSelectComponent implements OnInit, OnDestroy {

  actions: Action[] = [];

  selectedActions: Action[] = [];

  private criteria: ActionCriteria = new ActionCriteria();

  filterForm: UntypedFormGroup = this.formBuilder.group({
    description: []
  });

  constructor(
    private activeModal: NgbActiveModal,
    private formBuilder: UntypedFormBuilder,
    private actionService: ActionService
    ) { }

  ngOnInit(): void {
    this.search();
   }

  ngOnDestroy(): void { }

  selected(action: Action): void {
    if (!this.isSelected(action)) {
      this.selectedActions.push(action);
    } else {
      this.selectedActions.splice(this.position(action), 1);
    }
  }

  isSelected(action: Action): boolean {
    return (this.position(action) >= 0);
  }

  private position(action: Action): number {
    var result = -1;
    var pos = -1;
    this.selectedActions.forEach(a => {
      pos = pos + 1;
      if (a.id ==  action.id) {
        result = pos;
      }
    });
    return result;
  }

  filter() {
    this.criteria = this.filterForm.value;
    this.search();
  }

  private search(): void {
    this.actionService.findByCriteria(this.criteria).subscribe(
      (data) => this.actions = data
    );
  }

  ok(): void {
    this.activeModal.close(this.selectedActions);
  }

  dismiss(): void {
    this.activeModal.dismiss('Cross click');
  }

  cancel(): void {
    this.activeModal.dismiss('Close click');
  }
}
