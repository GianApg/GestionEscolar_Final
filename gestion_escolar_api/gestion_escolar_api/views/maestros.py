from django.db.models import *
from django.db import transaction
from gestion_escolar_api.models import Administradores, Maestros
from gestion_escolar_api.serializers import UserSerializer
from gestion_escolar_api.serializers import *
from gestion_escolar_api.models import *
from rest_framework import permissions
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth.models import Group
import json
from django.shortcuts import get_object_or_404

class MaestrosAll(generics.ListAPIView):
    #Obtener todos los maestros
    # Necesita permisos de autenticación de usuario para poder acceder a la petición
    permission_classes = (permissions.IsAuthenticated,)
    def get(self, request, *args, **kwargs):
        maestros = Maestros.objects.filter(user__is_active=1).order_by("id")
        lista = MaestrosSerializer(maestros, many=True).data
        for maestro in lista:
            if isinstance(maestro, dict) and "materias_array" in maestro:
                try:
                    maestro["materias_array"] = json.loads(maestro["materias_array"])
                except Exception:
                    maestro["materias_array"] = []
        return Response(lista, 200)

class MaestrosView(generics.CreateAPIView):
    # Permisos por método (sobrescribe el comportamiento default)
    # Verifica que el usuario esté autenticado para las peticiones GET, PUT y DELETE
    def get_permissions(self):
        if self.request.method in ['GET', 'PUT', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return []  # POST no requiere autenticación

    def get(self, request, *args, **kwargs):
            maestro = Maestros.objects.filter(id=request.GET.get("id"), user__is_active=1).first()
            if not maestro:
                return Response({"message": "Maestro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            data = MaestrosSerializer(maestro).data
            # Deserializamos el arreglo de materias para que Angular lo pueda leer en los checkboxes
            if data.get("materias_array"):
                try:
                    data["materias_array"] = json.loads(data["materias_array"])
                except Exception:
                    data["materias_array"] = []
                    
            return Response(data, status=status.HTTP_200_OK)
    
    #Registrar nuevo usuario maestro
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        user = UserSerializer(data=request.data)
        if user.is_valid():
            role = request.data['rol']
            first_name = request.data['first_name']
            last_name = request.data['last_name']
            email = request.data['email']
            password = request.data['password']
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                return Response({"message":"Username "+email+", is already taken"},400)
            user = User.objects.create( username = email,
                                        email = email,
                                        first_name = first_name,
                                        last_name = last_name,
                                        is_active = 1)
            user.save()
            user.set_password(password)
            user.save()
            
            group, created = Group.objects.get_or_create(name=role)
            group.user_set.add(user)
            user.save()
            
            #Create a profile for the user (CON NUEVOS CAMPOS)
            maestro = Maestros.objects.create(user=user,
                                            id_trabajador= request.data["id_trabajador"],
                                            fecha_nacimiento= request.data["fecha_nacimiento"],
                                            telefono= request.data["telefono"],
                                            rfc= request.data["rfc"].upper(),
                                            cubiculo= request.data["cubiculo"],
                                            area_investigacion= request.data["area_investigacion"],
                                            materias_array = json.dumps(request.data["materias_array"]),
                                            campus = request.data.get("campus"),                   # <-- Nuevo
                                            sueldo_estimado = request.data.get("sueldo_estimado")) # <-- Nuevo
            maestro.save()
            return Response({"Maestro creado con ID= ": maestro.id }, 201)
        return Response(user.errors, status=status.HTTP_400_BAD_REQUEST)
    
    #Función para eliminar un maestro específico por su ID
    def delete(self, request, *args, **kwargs):
        maestro = get_object_or_404(Maestros, id=request.GET.get("id"))
        try:
            maestro.user.delete()
            return Response({"details":"Maestro eliminado"},200)
        except Exception as e:
            return Response({"details":"Error al eliminar maestro"},400)

    # -------------------------------------------------------------
    # Función para EDITAR (PUT) los datos
    # -------------------------------------------------------------
    def put(self, request, *args, **kwargs):
        # Buscamos el ID ya sea en la URL (?id=1) o en el Body del JSON
        item_id = request.query_params.get('id') or request.data.get('id')
        
        if not item_id:
            return Response({"error": "Falta el ID para editar"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            perfil = Maestros.objects.get(id=item_id)
            user = perfil.user 
            
            # Actualizamos la info de la cuenta de usuario (nombre y apellido)
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            user.save()

            # Actualizamos la info del perfil de MAESTRO
            if 'telefono' in request.data:
                perfil.telefono = request.data['telefono']
            if 'cubiculo' in request.data:
                perfil.cubiculo = request.data['cubiculo']
            if 'area_investigacion' in request.data:
                perfil.area_investigacion = request.data['area_investigacion']
            if 'campus' in request.data:                                   # <-- Nuevo
                perfil.campus = request.data['campus']
            if 'sueldo_estimado' in request.data:                          # <-- Nuevo
                perfil.sueldo_estimado = request.data['sueldo_estimado']
            
            # Si quieres permitir que editen las materias también:
            if 'materias_array' in request.data:
                perfil.materias_array = json.dumps(request.data['materias_array'])
            
            perfil.save()
            
            return Response({"message": "Registro del maestro actualizado exitosamente"}, status=status.HTTP_200_OK)
            
        except Maestros.DoesNotExist:
            return Response({"error": "El registro no existe en la base de datos"}, status=status.HTTP_404_NOT_FOUND)