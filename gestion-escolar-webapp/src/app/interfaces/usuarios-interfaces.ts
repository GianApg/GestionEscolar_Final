// Cree estas interfaces para mantener más limpio el codigo
// Tambien para dividirlo por tipo de usuario
// La ventaja es que se pueden importar y ya no se ve feo afuera de la clase

/// Interfaz datos de usuario de maestro
export interface DatosMaestro {
  id: number;
  id_trabajador: number;
  first_name: string;
  last_name: string;
  email: string;
  fecha_nacimiento: string;
  telefono: string;
  rfc: string;
  cubiculo: string;
  area_investigacion: number;
}

//TODO: Crear interfaces para alumno y administrador
