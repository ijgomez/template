import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-save-button',
  templateUrl: './save-button.component.html',
  styleUrls: ['./save-button.component.scss']
})
export class SaveButtonComponent implements OnInit {

  @Input()
  disabled : boolean = false;

  constructor() { }

  ngOnInit(): void { }

}
