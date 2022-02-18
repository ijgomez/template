import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerTimestampComponent } from './server-timestamp.component';

describe('ServerTimestampComponent', () => {
  let component: ServerTimestampComponent;
  let fixture: ComponentFixture<ServerTimestampComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerTimestampComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerTimestampComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
