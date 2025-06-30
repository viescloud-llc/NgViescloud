import { inject, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from '../guards/auth.interceptor';

const LIST = [
  CommonModule,
  BrowserModule,
  FormsModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  MatNativeDateModule
]

// export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
//   // Inject the current `AuthService` and use it to get an authentication token:
//   next.
//   return inject(AuthInterceptor).intercept(req, next);
// }

@NgModule({
  declarations: [

  ],
  imports: LIST,
  exports: LIST,
})
export class NgEssentialModule { }
