import { Component } from '@angular/core';
import { NavbarUser } from '../../partials/navbar-user/navbar-user';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    NavbarUser,
    RouterOutlet
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
})
export class DashboardLayout {

}
