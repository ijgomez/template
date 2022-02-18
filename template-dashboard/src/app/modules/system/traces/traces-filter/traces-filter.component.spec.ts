import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TracesFilterComponent } from './traces-filter.component';

describe('TracesFilterComponent', () => {
  let component: TracesFilterComponent;
  let fixture: ComponentFixture<TracesFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TracesFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TracesFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
