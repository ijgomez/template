import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionsSelectorComponent } from './actions-selector.component';

describe('ActionsSelectorComponent', () => {
  let component: ActionsSelectorComponent;
  let fixture: ComponentFixture<ActionsSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActionsSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionsSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
