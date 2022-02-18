import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from 'src/app/core/services/reports/report.service';
import { Location } from '@angular/common';
import { ReportEngine } from 'src/app/core/models/reports/report-engine.model';
import * as saveAs from 'file-saver';
import { TemplateFormBaseComponent } from '../../../shared/components/forms/base/template-form-base-component.component';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent extends TemplateFormBaseComponent implements OnInit, OnDestroy, AfterViewInit {
  
  public reportForm : FormGroup = this.formBuilder.group({
    id: [],
    name: ['', Validators.required],
    description: ['', Validators.required],
    engine: [null, Validators.required]
  });

  public engines!: ReportEngine[];

  public engineSelected : ReportEngine | undefined;

  constructor(
      protected formBuilder: FormBuilder,
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location,
      private reportService: ReportService,
      private cd: ChangeDetectorRef
    ) { 
      super(formBuilder, router, route, location);
    }

  ngOnInit(): void {
    this.heading.push("Reports");
    super.ngOnInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  ngAfterViewInit(): void {
    this.reportForm.get('engine')?.valueChanges.subscribe(
      e => { this.changeFormGroup(e) }
    );
  }

  protected service(): any {
    return this.reportService;
  }

  protected form(): FormGroup {
    return this.reportForm;
  }

  protected handlerLoadEntity(data: any): void {
    this.changeFormGroup(data.engine);

  }

  protected handlerDefaultDataForm(): void {
    
  }

  protected backPreviousView(): void {
    this.router.navigate(['/reports'], { replaceUrl: true });
  }
  
  public changeFormGroup(engine: ReportEngine) : void {
   this.engineSelected = engine;
    if (engine == null) {
      this.reportForm.removeControl('url');
      this.reportForm.removeControl('archive');
    }
    
    if (engine != null && engine.type == 'JASPER') {
      this.reportForm.removeControl('url');
      this.reportForm.addControl('descriptor', new FormGroup({
        filename: new FormControl(''),
        data: new FormControl(null, Validators.required),
        filetype: new FormControl(''),
        size: new FormControl('')
      }));
    }

    if (engine != null && engine.type == 'HTML') {
      this.reportForm.removeControl('descriptor');
      this.reportForm.addControl('url', new FormControl('', Validators.required));
    }

  }

  isSelected(es : string): boolean {
    if (this.engineSelected != undefined) {
      return (this.engineSelected.type == es);
    }
    return false;
  }

  onFileChange(event: any) {

    const reader = new FileReader();
 
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;

      reader.onload = () => {
        this.reportForm.patchValue({
          descriptor: {
            filename: file.name,
            data: (reader.result as String).split(';base64,')[1],
            filetype: file.type,
            size: file.size
          }
        });

        // need to run CD since file load runs outside of zone
        this.cd.markForCheck();
      };

      reader.onloadend = (e) => {
        console.log("Input: File end loaded");
      };

      reader.onerror = (error) => {
        console.log("Input: File could not be read:" + error);
      };

      reader.readAsDataURL(file);
    }
  }

  private datatoBlob(archive: any) {
    const byteString = window.atob(archive.data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([int8Array], { type: archive.filetype });    
    return blob;
  }

  isDescriptorPresent(): boolean {
    return (this.reportForm.get("descriptor")?.get("filename")?.value !== '');
  }

  download() {
    var descriptorForm = this.reportForm.get("descriptor");
    if (descriptorForm != null) {
      var filename = descriptorForm.get("filename")?.value;
      var filetype = descriptorForm.get("filetype")?.value;
      var descriptor = new File([this.datatoBlob(descriptorForm.value)], filename, {type:filetype});

      saveAs(descriptor, filename);
     }
  }
  
}
