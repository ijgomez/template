import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TemplateService } from '../base/template.service';
import { PropertyCriteria } from '../../models/system/property-criteria.model';
import { Property } from '../../models/system/property.model';

@Injectable({
  providedIn: 'root'
})
export class PropertiesService extends TemplateService<Property, PropertyCriteria> {

  constructor(public http: HttpClient) { super(http, '/api/properties'); }

}
