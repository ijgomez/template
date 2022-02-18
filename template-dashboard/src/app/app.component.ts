import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/security/auth.service';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  supportedLanguages = ['en', 'es'];

  isLoggedIn$: Observable<boolean> | undefined;

  constructor(
    private authService: AuthService,
    private translateService: TranslateService) {
    
      translateService.addLangs(this.supportedLanguages);
      translateService.setDefaultLang(this.supportedLanguages[0]);
      
      translateService.use(this.supportedLanguages[0]);
  }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn;
  }

  logout(event: any) {
    console.log('logout: ' + event);
    this.authService.logout();
  }
}
