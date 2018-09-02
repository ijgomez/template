import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestExecutorComponent } from './request-executor.component';

describe('RequestExecutorComponent', () => {
  let component: RequestExecutorComponent;
  let fixture: ComponentFixture<RequestExecutorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestExecutorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestExecutorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
