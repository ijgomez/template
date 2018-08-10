import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorsHomeComponent } from './monitors-home.component';

describe('MonitorsHomeComponent', () => {
  let component: MonitorsHomeComponent;
  let fixture: ComponentFixture<MonitorsHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonitorsHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitorsHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
