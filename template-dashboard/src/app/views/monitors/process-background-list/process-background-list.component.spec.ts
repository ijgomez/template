import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessBackgroundListComponent } from './process-background-list.component';

describe('ProcessBackgroundListComponent', () => {
  let component: ProcessBackgroundListComponent;
  let fixture: ComponentFixture<ProcessBackgroundListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProcessBackgroundListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessBackgroundListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
