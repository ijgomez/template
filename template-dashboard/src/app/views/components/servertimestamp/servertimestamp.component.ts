import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { StatusService } from '../../../services/commons/status.service';

@Component({
  selector: 'app-servertimestamp',
  templateUrl: './servertimestamp.component.html',
  styleUrls: ['./servertimestamp.component.css']
})
export class ServertimestampComponent implements OnInit, OnDestroy {

  @Input()
  interval = 1000;

  dateTime: Date;

  message: any;

  private timer;

  constructor(private statusService: StatusService) { }

  ngOnInit() {
    this.timer = setInterval(() => { this.reload(); }, this.interval);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  reload(): void {
    this.statusService.serverTimestamp().subscribe(
      response => {
        this.dateTime = response;
        this.message = null;
      },
      error => {
        this.message = error;
      }
    );
  }

}
