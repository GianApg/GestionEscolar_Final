import { Component, HostListener, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthServices } from '../../services/auth-services';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '../../shared/shared.imports';

@Component({
  selector: 'app-navbar-user',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './navbar-user.html',
  styleUrl: './navbar-user.scss',
})
export class NavbarUser implements OnInit{

  public expandedMenu: string | null = null;
  public userInitial: string = '';
  public isMobileView: boolean = false;
  public showUserMenu: boolean = false;
  public mobileOpen: boolean = false;

  // Estas variables se utilizarán por si se habilita el tema oscuro
  paletteMode: 'light' | 'dark' = 'light';
  colorPalettes = {
    light: {
      '--background-main': '#f4f7fb',
      '--sidebar-bg': '#23395d',
      '--navbar-bg': '#fff',
      '--text-main': '#222',
      '--table-bg': '#fff',
      '--table-header-bg': '#cfe2ff',
    },
    dark: {
      '--background-main': '#181a1b',
      '--sidebar-bg': '#1a2636',
      '--navbar-bg': '#222',
      '--text-main': '#e4ecfa',
      '--table-bg': '#222',
      '--table-header-bg': '#30507a',
    }
  };

  togglePalette() {
    this.paletteMode = this.paletteMode === 'light' ? 'dark' : 'light';
    const palette = this.colorPalettes[this.paletteMode];
    (Object.keys(palette) as Array<keyof typeof palette>).forEach(key => {
      document.documentElement.style.setProperty(key, palette[key]);
    });
  }

  constructor(
    private router: Router,
    private authService: AuthServices
  ) {
    const name = this.authService.getUserCompleteName();
    this.userInitial = (name && name.length > 0) ? name.trim()[0].toUpperCase() : '?';
  }

  ngOnInit(): void {
    this.isMobileView = window.innerWidth <= 992;
    // Aplicar paleta inicial
    const palette = this.colorPalettes['light'];
    (Object.keys(palette) as Array<keyof typeof palette>).forEach(key => {
      document.documentElement.style.setProperty(key, palette[key]);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = window.innerWidth <= 992;
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

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  editUser() {
    const userId = this.authService.getUserId();
    const userRole = this.authService.getUserGroup();
    this.router.navigate(['/registro-usuarios', userRole, userId]);
    this.showUserMenu = false;
  }

  toggleMenu(menu: string) {
    this.expandedMenu = this.expandedMenu === menu ? null : menu;
  }

  closeMenu() {
    this.expandedMenu = null;
  }

  logout() {
    // TODO: Después modificar el servicio de logout para que limpie la sesión en el backend
    this.authService.logout().subscribe(
      () => {
        this.authService.destroyUser();
        this.router.navigate(['/login']);
        this.closeSidebar();
      },
      () => {
        this.authService.destroyUser();
        this.router.navigate(['/login']);
        this.closeSidebar();
      }
    );
  }

  // Role helpers — delegados a FacadeService (fuente única de verdad)
  isAdmin(): boolean { return this.authService.isAdmin(); }
  isTeacher(): boolean { return this.authService.isTeacher(); }
  isStudent(): boolean { return this.authService.isStudent(); }
  canSeeAdminItems(): boolean { return this.authService.canSeeAdminItems(); }
  canSeeTeacherItems(): boolean { return this.authService.canSeeTeacherItems(); }
  canSeeStudentItems(): boolean { return this.authService.canSeeStudentItems(); }
  canSeeHomeItem(): boolean { return this.authService.canSeeHomeItem(); }
  canSeeRegisterItem(): boolean { return this.authService.canSeeRegisterItem(); }
}
