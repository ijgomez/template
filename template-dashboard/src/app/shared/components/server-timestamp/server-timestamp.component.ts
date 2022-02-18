import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { StatusService } from 'src/app/core/services/system/status.service';

@Component({
  selector: 'app-server-timestamp',
  templateUrl: './server-timestamp.component.html',
  styleUrls: ['./server-timestamp.component.scss']
})
export class ServerTimestampComponent implements OnInit, OnDestroy {

  @Input()
  interval = 1000;

  dateTime: Date | undefined;

  message: any;

  private timer!: any;
  
  constructor(private statusService: StatusService) { }
  

  ngOnInit(): void {
    this.timer = setInterval(() => { this.reload(); }, this.interval);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private reload(): void {
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
