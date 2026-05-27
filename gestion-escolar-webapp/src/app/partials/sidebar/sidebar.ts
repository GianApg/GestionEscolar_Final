import { Component, HostListener, OnInit } from '@angular/core';
import { AuthServices } from '../../services/auth-services';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '../../shared/shared.imports';

@Component({
  selector: 'app-sidebar',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit{
  public mobileOpen = false;
  public isMobileView = false;

  constructor(
    private router: Router,
    private authService: AuthServices
  ) {
  }

  ngOnInit(): void {
    this.isMobileView = window.innerWidth < 900;
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = window.innerWidth < 900;
    if (!this.isMobileView) {
      this.mobileOpen = false;
    }
  }

  toggleSidebar() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeSidebar() {
    this.mobileOpen = false;
  }

  logout() {
    this.authService.logout().subscribe(
      (response) => {
        this.authService.destroyUser();
        this.router.navigate(['/login']);
        this.closeSidebar();
      },
      (error) => {
        // Fallback: clear local data and navigate anyway
        this.authService.destroyUser();
        this.router.navigate(['/login']);
        this.closeSidebar();
      }
    );
  }

  // Helper methods — delegados a FacadeService (fuente única de verdad)
  isAdmin(): boolean { return this.authService.isAdmin(); }
  isTeacher(): boolean { return this.authService.isTeacher(); }
  isStudent(): boolean { return this.authService.isStudent(); }
  canSeeAdminItems(): boolean { return this.authService.canSeeAdminItems(); }
  canSeeTeacherItems(): boolean { return this.authService.canSeeTeacherItems(); }
  canSeeStudentItems(): boolean { return this.authService.canSeeStudentItems(); }
  canSeeHomeItem(): boolean { return this.authService.canSeeHomeItem(); }
  canSeeRegisterItem(): boolean { return this.authService.canSeeRegisterItem(); }

}
