import { Component, OnInit } from '@angular/core';
import { PropertiesService } from '../../../../services/support/properties.service';
import { PropertyCriteria } from '../../../../domain/support/property-criteria';

@Component({
  selector: 'app-properties-list',
  templateUrl: './properties-list.component.html',
  styleUrls: ['./properties-list.component.css']
})
export class PropertiesListComponent implements OnInit {

  data: any[];

  constructor(private propertiesService: PropertiesService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.propertiesService.findByCriteria(new PropertyCriteria()).subscribe(
      result => { this.data = result; },
      error => { console.error(error); }
    );
  }

  delete(id: number): void {
    this.propertiesService.read(id).subscribe(
    data => {
      this.propertiesService.delete(data).subscribe(
        result => { this.loadData(); },
        error => { console.error(error); });
    },
    error => {
      console.error(error);
    });
  }

}
