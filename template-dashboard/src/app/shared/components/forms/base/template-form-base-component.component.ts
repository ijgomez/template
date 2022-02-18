import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from "@angular/router";
import { Observable } from "rxjs";

@Component({
    template: ''
})
export abstract class TemplateFormBaseComponent implements OnInit, OnDestroy {

    /** View mode */
    protected mode: String | null = null;

    public heading: String[] = []; 

    /** Messages or Notifications to display to the user. */
    public message: any;

    /** New Instance */
    constructor(
        protected formBuilder: FormBuilder,
        protected router: Router,
        protected route: ActivatedRoute,
        protected location: Location
    ) { }
    
    ngOnInit(): void {
        var id = this.route.snapshot.params['id'];
        this.mode = (id == undefined) ? 'CREATE':'EDIT';
        if (this.isEditMode()) {
            this.loadEntity(id);
        }
        this.loadDefaultDataForm();
    }

    ngOnDestroy(): void {
        // throw new Error("Method not implemented.");
    }

    /** Informs if the form is in create mode. */
    protected isCreateMode(): boolean {
        return (this.mode == 'CREATE');
    }

    /** Informs if the form is in edit mode. */
    protected isEditMode(): boolean {
        return (this.mode == 'EDIT');
    }

    protected abstract service(): any;

    protected abstract form(): FormGroup;

    /** Method that loads the entity's information into the form. */
    protected loadEntity(id: number): void {
        this.service().read(id).subscribe(
          (data: any) => {
            this.handlerLoadEntity(data);
            this.form().patchValue(data);
          },
          (error:any) => { this.message = error },
          () => { console.log('load data complete!'); }
        );
      }

    protected abstract handlerLoadEntity(data: any): void;

    protected loadDefaultDataForm(): void {
        this.handlerDefaultDataForm();
    }

    protected abstract handlerDefaultDataForm(): void;
    
    isValidInput(fieldName: any): boolean {
        return this.form().controls[fieldName]?.invalid && (this.form().controls[fieldName]?.dirty || this.form().controls[fieldName]?.touched);
    }

    save(): void {
        this.saveOrUpdate(this.form().value).subscribe(
            (result: any) => {
                console.log('Operation Completed! => Result:' + result);
                this.backPreviousView();
            },
            (error:any) => { this.message = error },
            () => { console.log('Operation completed') }
        );
    }

    private saveOrUpdate(report: any) : Observable<number> {
        if (this.isCreateMode()) {
            return this.service().create(report);
        } else {
            return this.service().update(report);
        }
    }

    protected abstract backPreviousView(): void;

    cancel(): void {
        this.backPreviousView();
    }

}
