import { Component, OnInit } from '@angular/core';
import { AdminScreen } from '../admin-screen/admin-screen';
import { MaestrosScreen } from '../maestros-screen/maestros-screen';
import { AlumnosScreen } from '../alumnos-screen/alumnos-screen';
import { AuthServices } from '../../services/auth-services';

@Component({
  selector: 'app-home-screen',
  imports: [
    AdminScreen,
    MaestrosScreen,
    AlumnosScreen
  ],
  templateUrl: './home-screen.html',
  styleUrl: './home-screen.scss',
})
export class HomeScreen implements OnInit {
  public rol: string = '';

  constructor(private authService: AuthServices) {}

  ngOnInit(): void {
    this.rol = this.authService.getUserGroup() ?? '';
  }
}
