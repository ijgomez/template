import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Credentials } from 'src/app/core/models/security/credentials.model';
import { AuthService } from 'src/app/core/services/security/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup = this.formBuilder.group({
    username: ['admin', Validators.required],
    password: ['admin', Validators.required]
  });

  return: string = '';

  message: any;

  constructor(
      private authService: AuthService,
      private router: Router, 
      private route: ActivatedRoute,
      private formBuilder: FormBuilder
    ) { 
      
    }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => this.return = params['return'] || '/');
  }

  isValidInput(fieldName: any): boolean {
    return this.loginForm.controls[fieldName].invalid && (this.loginForm.controls[fieldName].dirty || this.loginForm.controls[fieldName].touched);
  }

  login() {
    var credentials: Credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe(
      data => {
        this.router.navigateByUrl(this.return, { replaceUrl: true});
      },
      err => {
        this.message = err;
      }
    );
  }

}
