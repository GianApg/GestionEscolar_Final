import { Component, Input, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { Router, ActivatedRoute } from '@angular/router';
import { AlumnosService } from '../../services/alumnos-service';
import { NotificationService } from '../../services/tools/notification-service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-registro-alumnos',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './registro-alumnos.html',
  styleUrl: './registro-alumnos.scss',
})
export class RegistroAlumnos implements OnInit{

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  public alumno:any= {};
  public errors:any={};
  public editar:boolean = false;
  public idUser: number = 0;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private location : Location,
    private activatedRoute: ActivatedRoute,
    private alumnosService: AlumnosService
  ) {
  }

  ngOnInit() {
    // Validamos si viene un ID en la URL para activar el modo edición
    if(this.activatedRoute.snapshot.params['id'] !== undefined){
      this.editar = true;
      this.idUser = this.activatedRoute.snapshot.params['id'];
      
      // ASIGNACIÓN CRÍTICA: Copia los datos cargados del servidor al objeto del formulario
      this.alumno = this.datos_user; 
    }else{
      // Si es un registro nuevo, inicializa el esquema limpio
      this.alumno = this.alumnosService.esquemaAlumno();
      this.alumno.rol = this.rol;
    }
  }

  public regresar(){
    this.location.back();
  }

  public registrar(){
    //Validamos si el formulario está lleno y correcto
    this.errors = {};
    this.errors = this.alumnosService.validarAlumno(this.alumno, this.editar);
    if(Object.keys(this.errors).length > 0){
      return;
    }
    // Lógica para registrar un nuevo alumno
    if(this.alumno.password === this.alumno.confirmar_password){
      this.alumnosService.registrarAlumno(this.alumno).subscribe(
        (response) => {
          // Redirigir o mostrar mensaje de éxito
          this.notificationService.success("Alumno registrado exitosamente");
          this.router.navigate(['/alumnos']);
        },
        (error) => {
          // Manejar errores de la API
          this.notificationService.error("Error al registrar alumno");
        }
      );
    }else{
      this.notificationService.error("Las contraseñas no coinciden");
      this.alumno.password="";
      this.alumno.confirmar_password="";
    }
  }

  public actualizar(){
    // Lógica para actualizar los datos de un alumno existente
  }

  //Funciones para password
  showPassword()
  {
    if(this.inputType_1 === 'password'){
      this.inputType_1 = 'text';
      this.hide_1 = true;
    }
    else{
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  showPwdConfirmar()
  {
    if(this.inputType_2 === 'password'){
      this.inputType_2 = 'text';
      this.hide_2 = true;
    }
    else{
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }

  //Función para detectar el cambio de fecha
  public changeFecha(event :any){
    this.alumno.fecha_nacimiento = event.value.toISOString().split("T")[0];
  }

  public soloLetras(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // Permitir solo letras (mayúsculas y minúsculas) y espacio
    if (
      !(charCode >= 65 && charCode <= 90) &&  // Letras mayúsculas
      !(charCode >= 97 && charCode <= 122) && // Letras minúsculas
      charCode !== 32                         // Espacio
    ) {
      event.preventDefault();
    }
  }

}
