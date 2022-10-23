import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { TemplateFilterComponent } from 'src/app/shared/components/filter/template-filter/template-filter.component';
import { ProfileCriteria } from 'src/app/core/models/security/profile-criteria.model';

@Component({
  selector: 'app-profile-filter',
  templateUrl: './profile-filter.component.html',
  styleUrls: ['./profile-filter.component.scss']
})
export class ProfileFilterComponent extends TemplateFilterComponent<ProfileCriteria> implements OnInit {

  constructor(private formBuilder: UntypedFormBuilder) {
    super(formBuilder.group({
      name: [],
      description: []
    }));
   }

  ngOnInit(): void {
  }

}
