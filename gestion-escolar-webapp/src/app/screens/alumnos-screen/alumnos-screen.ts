import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { AuthServices } from '../../services/auth-services';
import { Router } from '@angular/router';
// Cambiamos el de Admin por el de Alumnos
import { AlumnosService } from '../../services/alumnos-service'; 
import { NotificationService } from '../../services/tools/notification-service';
import { EliminarUserModal } from '../../modals/eliminar-user-modal/eliminar-user-modal';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-alumnos-screen',
  standalone: true, 
  imports: [SHARED_IMPORTS], // <-- Aquí metemos todos tus imports globales
  templateUrl: './alumnos-screen.html',
  styleUrl: './alumnos-screen.scss',
})
export class AlumnosScreen implements OnInit {
  
  public name_user: string = ''; 
  public alumnos: any[] = [];

  constructor(
    private authService: AuthServices,
    private router: Router,
    private alumnosService: AlumnosService,
    private notificationService: NotificationService,
    public dialog: MatDialog // <-- Inyectamos el servicio de modales de Material
  ) {}

  ngOnInit(): void {
    // Si tienes cómo sacar el nombre del usuario logueado desde el authService, sería algo así:
    // const user = this.authService.getUser();
    // if (user) { this.name_user = user.first_name; }
    console.log("¡SÍ ENTRÓ A LA PANTALLA DE ALUMNOS!");
    this.cargarAlumnos();
  }

  // 1. Cargar la tabla
  public cargarAlumnos() {
    this.alumnosService.obtenerListaAlumnos().subscribe({
      next: (response) => {
        this.alumnos = response; // <-- ¡Asegúrate de que diga this.alumnos!
      },
      error: (error) => {
        console.error("Error al cargar la lista: ", error);
       
      }
    });
  }

  // 2. Editar alumno
  public goEditar(idUser: number) {
  this.router.navigate(['/registro-usuarios', 'alumno', idUser]);
  }
  // 3. Eliminar usando tu modal chingón
  public delete(id: number) {
    // Abrimos el modal de eliminar pasándole el ID del alumno
    const dialogRef = this.dialog.open(EliminarUserModal, {
      width: '350px',
      data: { id: id, rol: 'alumno' } // Asumiendo que tu modal necesita saber qué va a borrar
    });

    // Escuchamos qué pasa cuando el modal se cierra
    dialogRef.afterClosed().subscribe(result => {
      // Si el modal devuelve un 'true' (o sea, si sí confirmaron el borrado y salió bien)
      if (result) {
       
        this.cargarAlumnos(); // Refrescamos la tabla
      }
    });
  }

}