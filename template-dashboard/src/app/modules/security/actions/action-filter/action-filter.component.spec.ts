import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionFilterComponent } from './action-filter.component';

describe('ActionFilterComponent', () => {
  let component: ActionFilterComponent;
  let fixture: ComponentFixture<ActionFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActionFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
