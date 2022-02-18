import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as saveAs from 'file-saver';
import { Report } from 'src/app/core/models/reports/report.model';
import { ReportService } from '../../../core/services/reports/report.service';

@Component({
  selector: 'app-report-execute',
  templateUrl: './report-execute.component.html',
  styleUrls: ['./report-execute.component.scss']
})
export class ReportExecuteComponent implements OnInit, OnDestroy {

  questions!: any[];

  message : any;

  heading: String[] = []; 

  private id : any;

  private report: Report | null = null;

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
  ) { }
  
  ngOnInit(): void { 
    this.heading.push("Reports");

    this.id = this.activeRoute.snapshot.params['id'];
    this.reportService.read(this.id).subscribe(result => {
      this.report = result;
      this.reportService.params(this.id).subscribe(result => {
        this.questions = result;
      }, (error) => { 
        this.message = error;
        this.questions = [];
      });
    },
    (error) => { this.message = error;});
    
  }
  
  ngOnDestroy(): void { }

  get name(): string | undefined {
    return this.report?.name;
  }

  onSubmit(form: any): void {
    this.reportService.execute(this.id, form.value).subscribe(
      response => {
         const filename = response.headers.get('content-disposition').split(';')[1].split('=')[1].replace(/\"/g, '');
        // get the response as blob, rename the file, and save  it
        const file = new Blob([response.body], { type: response.body.type });
        
        saveAs(file, filename);

      },
      error => {
        this.message = error;
      },
      () => {
        console.log('Completed file download.');
      }
    );
  }

  onCancel() {
    this.router.navigate(['/reports'], { replaceUrl: true });
  }

}
