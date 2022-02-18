import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterFilterComponent } from './cluster-filter.component';

describe('ClusterFilterComponent', () => {
  let component: ClusterFilterComponent;
  let fixture: ComponentFixture<ClusterFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClusterFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
