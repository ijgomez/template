import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Security } from './security-home.component';

describe('SecurityHomeComponent', () => {
  let component: Security;
  let fixture: ComponentFixture<Security>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Security ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Security);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
