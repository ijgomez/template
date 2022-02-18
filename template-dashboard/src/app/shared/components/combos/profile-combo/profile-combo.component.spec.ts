import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComboComponent } from './profile-combo.component';

describe('ProfileComboComponent', () => {
  let component: ProfileComboComponent;
  let fixture: ComponentFixture<ProfileComboComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfileComboComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComboComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
