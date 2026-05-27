import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthServices } from '../services/auth-services';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthServices,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = this.authService.getSessionToken();
    if (token && token !== '') {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
