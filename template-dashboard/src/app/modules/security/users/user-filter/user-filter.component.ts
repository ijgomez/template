import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { TemplateFilterComponent } from 'src/app/shared/components/filter/template-filter/template-filter.component';
import { UserCriteria } from 'src/app/core/models/security/user-criteria.model';

@Component({
  selector: 'app-user-filter',
  templateUrl: './user-filter.component.html',
  styleUrls: ['./user-filter.component.scss']
})
export class UserFilterComponent extends TemplateFilterComponent<UserCriteria> implements OnInit {

  constructor(private formBuilder: UntypedFormBuilder) {
    super(formBuilder.group({
      username: [],
      profile: []
    }));
   }

  ngOnInit(): void {

  }

}
