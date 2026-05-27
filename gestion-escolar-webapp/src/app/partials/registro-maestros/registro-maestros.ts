import { Component, Input, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared/shared.imports';
import { Router, ActivatedRoute } from '@angular/router';

import { Location } from '@angular/common';
import { MaestrosService } from '../../services/maestros-service';
import { NotificationService } from '../../services/tools/notification-service';

@Component({
  selector: 'app-registro-maestros',
  imports: [
    ...SHARED_IMPORTS
  ],
  templateUrl: './registro-maestros.html',
  styleUrl: './registro-maestros.scss',
})
export class RegistroMaestros implements OnInit {

  @Input() rol:string = "";
  @Input() datos_user:any = {};

  public maestro: any = {};
  public errors: any = {};
  public editar:boolean = false;
  public idUser: number = 0;

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  //Para el select
  public areas: any[] = [
    {value: '1', viewValue: 'Desarrollo Web'},
    {value: '2', viewValue: 'Programación'},
    {value: '3', viewValue: 'Bases de datos'},
    {value: '4', viewValue: 'Redes'},
    {value: '5', viewValue: 'Matemáticas'},
  ];

  public materias:any[] = [
    {value: '1', nombre: 'Aplicaciones Web'},
    {value: '2', nombre: 'Programación 1'},
    {value: '3', nombre: 'Bases de datos'},
    {value: '4', nombre: 'Tecnologías Web'},
    {value: '5', nombre: 'Minería de datos'},
    {value: '6', nombre: 'Desarrollo móvil'},
    {value: '7', nombre: 'Estructuras de datos'},
    {value: '8', nombre: 'Administración de redes'},
    {value: '9', nombre: 'Ingeniería de Software'},
    {value: '10', nombre: 'Administración de S.O.'},
  ];

  constructor(
    private location: Location,
    private router: Router,
    private maestrosService: MaestrosService,
    private notificationService: NotificationService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    // Validamos si viene un ID en la URL para activar el modo edición
    if(this.activatedRoute.snapshot.params['id'] !== undefined){
      this.editar = true;
      this.idUser = this.activatedRoute.snapshot.params['id'];
      
      // ASIGNACIÓN CRÍTICA: Copia los datos cargados del servidor al objeto del formulario
      this.maestro = this.datos_user; 
    }else{
      // Si es un registro nuevo, inicializa el esquema limpio
      this.maestro = this.maestrosService.esquemaMaestro();
      this.maestro.rol = this.rol;
    }
  }
  //Funciones para password
  public showPassword()
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

  public showPwdConfirmar()
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

  public regresar(){
    this.location.back();
  }

  public registrar(){

    // Inicializo el objeto de errores para evitar que se muestren errores anteriores o datos anteriores al momento de registrar un nuevo admin
    this.errors = {};
    console.log("Datos del maestro: ", this.maestro);

    // Validar datos y mostrar errores
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    //Verificamos si el objeto de errores está vacío, lo que indica que no hay errores de validación
    if(Object.keys(this.errors).length > 0){
      return;
    }

    // Validar si las contraseñas coinciden solo si no se está editando, ya que en la edición no es obligatorio cambiar la contraseña
    if(this.maestro.password === this.maestro.confirmar_password){
      //Lógica para registrar el maestro, conectando con el backend y mostrando notificaciones de éxito o error según corresponda
      this.maestrosService.registrarMaestro(this.maestro).subscribe({
        next: (response) => {
          this.notificationService.success("Maestro registrado exitosamente");
          this.router.navigate(['/maestros']);
        },
        error: (error) => {
          console.error("Error al registrar el maestro: ", error);
          this.notificationService.error("Error al registrar el maestro. Por favor, inténtalo de nuevo.");
        }
      });
    }else{
      this.notificationService.error("Las contraseñas no coinciden");
      this.maestro.password="";
      this.maestro.confirmar_password="";
    }

  }


  // Función de validación estricta para el sueldo (Solo acepta números y un punto decimal)
  public soloNumeros(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // Permitir solo números (48-57) y el punto decimal (46)
    if (
      !(charCode >= 48 && charCode <= 57) && 
      charCode !== 46
    ) {
      event.preventDefault(); // Bloquea la tecla si no es número
    }
  }

  public actualizar(){

  }

  //Función para detectar el cambio de fecha
  public changeFecha(event :any){
    this.maestro.fecha_nacimiento = event.value.toISOString().split("T")[0];
  }

  // Funciones para los checkbox
  public checkboxChange(event:any){
    if(event.checked){
      this.maestro.materias_array.push(event.source.value)
    }else{
      this.maestro.materias_array.forEach((materia: any, i: any) => {
        if(materia === event.source.value){
          this.maestro.materias_array.splice(i,1)
        }
      });
    }
  }

  public revisarSeleccion(nombre: string){
    if(this.maestro.materias_array){
      const busqueda = this.maestro.materias_array.find((element: string)=>element===nombre);
      if(busqueda !== undefined){
        return true;
      }else{
        return false;
      }
    }else{
      return false;
    }
  }

}
