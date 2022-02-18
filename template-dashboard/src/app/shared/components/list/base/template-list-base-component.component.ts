import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ADTSettings } from "angular-datatables/src/models/settings";
import * as saveAs from "file-saver";
import { DataTableResponse } from "src/app/core/models/base/data-table-response.model";
import { Entity } from "src/app/core/models/base/entity.model";
import { TemplateCriteria } from "src/app/core/models/base/template-criteria.model";
import { DatatableComponent } from "../../datatable/datatable.component";
import { ToolbarComponent } from "../../toolbar/toolbar.component";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmComponent } from '../../modal/confirm/confirm.component';

@Component({
    template: ''
  })
export abstract class TemplateListBaseComponent implements OnInit, OnDestroy  {

    @ViewChild(ToolbarComponent, { static: false }) 
    toolbarComponent: ToolbarComponent | undefined;
  
    @ViewChild(DatatableComponent, { static: false }) 
    datatableComponent: DatatableComponent | undefined;
  
    heading: String[] = [];

    /** Messages or Notifications to display to the user. */
    message: any;

    /** Data table settings. */
    //dtOptions: DataTables.Settings = {};
    dtOptions: ADTSettings = {};

    /** Entity Selected */
    protected entity: Entity | null = null;

    /** Criteria */
    protected criteria: TemplateCriteria = new TemplateCriteria();

    /** New Instance */
    constructor(
        protected router: Router,
        protected route: ActivatedRoute,
        protected modalService: NgbModal
    ) { }

    ngOnInit(): void {
        
    }

    ngOnDestroy(): void {
        
    }

    protected datatable(dataTablesParameters: any, callback: any) {
        this.service().datatable(this.criteria, dataTablesParameters).subscribe(
          (response: DataTableResponse) => {
            callback(response);
          },
          this.showError,
          () => { console.log('datatable finished'); }
        );
      }

    protected abstract service(): any;

    process(event: any):void {
        console.log(event);
        switch (event) {
          case 'reload' : 
            this.reload();
            break;
          case 'edit' : 
            this.edit();
            break;
          case 'view' : 
            this.view();
            break;
          case 'delete' : 
            this.delete();
            break;
          case 'execute' :
            this.execute();
            break;
          case 'export' : 
            this.export();
            break;
        }
    }
      
    reload() {
        this.datatableComponent?.reload();
    }

    selected(data: any): void {
        this.entity = data;
        if (this.isSelected()) {
            this.toolbarComponent?.enable();
        } else {
            this.toolbarComponent?.disable();
        }
    }

    unselected():void {
      this.entity = null;
    }

    dbClick(data:any): void {
      this.selected(data);
      if (this.isSelected()) {
        this.edit();
      }
    }

    protected isSelected(): boolean {
        return (this.entity != null);
    };

    filter(criteria: any): void {
        this.criteria = criteria;
        this.reload();
    }

    edit() {
        this.router.navigate(['edit', this.entity?.id],{
          relativeTo:this.route,
          replaceUrl: true
        });
    }

    view() {
      this.router.navigate(['view', this.entity?.id],{
        relativeTo:this.route,
        replaceUrl: true
      });
    }

    delete() {
      
        this.service().read(this.entity?.id).subscribe(
            (data: any) => {
              const modalRef = this.modalService.open(ConfirmComponent, { centered: true});
              modalRef.componentInstance.title = 'Delete Operation';
              modalRef.componentInstance.message = 'Are you sure you want to delete the entry?';
              modalRef.result.then(
                () => {
                  this.service().delete(data).subscribe(
                    (result: any) => {
                        this.reload();
                    },
                    (e1:any) => { this.showError(e1) },
                    () => console.log('operation delete finished!')

                  );
                },
                (e: any) => { }
              );
            },
            (error: any) => { this.showError(error) }
        );
    }

    execute() {
        this.router.navigate(['exec', this.entity?.id],{
          relativeTo:this.route,
          replaceUrl: true
        });
    }

    export() {
        this.service().export(this.criteria).subscribe(
            (response: any) => {
              const filename = response.headers.get('content-disposition').split(';')[1].split('=')[1].replace(/\"/g, '');
              // get the response as blob, rename the file, and save  it
              const file = new Blob([response.body], { type: response.body.type });
              
              saveAs(file, filename);
            },
            this.showError
        );
    }

    showError(error: any): void {
      this.message = error;
      console.warn('not yet implemented!!');
      console.error(error);
    }
}
