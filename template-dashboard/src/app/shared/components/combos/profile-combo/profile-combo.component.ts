import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { ProfileCriteria } from 'src/app/core/models/security/profile-criteria.model';
import { Profile } from 'src/app/core/models/security/profile.model';
import { ProfileService } from '../../../../core/services/security/profile.service';

@Component({
  selector: 'app-profile-combo',
  templateUrl: './profile-combo.component.html',
  styleUrls: ['./profile-combo.component.scss'],
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProfileComboComponent),
      multi: true
    }
  ]
})
export class ProfileComboComponent implements ControlValueAccessor, OnInit, OnDestroy {

  public profiles: Observable<Profile[]> = new Observable<Profile[]>();

  public _profileSelected: Profile | null = null;

  get value(): any {
    return this._profileSelected;
  }

  set value(val: Profile) {
    this._profileSelected = val;
    this.onChangeCallback(val);
  }

  isDisabled: boolean = false;

  @Input()
  id : String | null = null;

  @Input()
  name : string | null = null;

  @Output() 
  onchangeEvent:EventEmitter<Profile> = new EventEmitter<Profile>();

  onChangeCallback: Function = () => {};

  onTouchedCallback: Function = () => {};

  constructor(private profileService:ProfileService) { }
  
  ngOnInit(): void {
    this.profiles = this.profileService.findByCriteria(new ProfileCriteria());
  }

  ngOnDestroy(): void { }

  compareFn(p1: Profile, p2: Profile): boolean {
    return p1 && p2 ? p1.id === p2.id : p1 === p2;
  }

  writeValue(profile: Profile): void {
    this.value = profile ?? null;
  }

  registerOnChange(fn: Function): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: Function): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void { 
    this.isDisabled = isDisabled; 
  }

  onChange(data:Profile):void {
    this.onchangeEvent.emit(data);
  }
}
