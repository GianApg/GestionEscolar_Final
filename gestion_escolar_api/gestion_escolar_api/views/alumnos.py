from django.db.models import *
from django.db import transaction
from gestion_escolar_api.models import Administradores, Maestros, Alumnos
from gestion_escolar_api.serializers import UserSerializer
from gestion_escolar_api.serializers import *
from rest_framework import permissions
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth.models import Group
from django.shortcuts import get_object_or_404
import json

class AlumnosView(generics.CreateAPIView):
    def get_permissions(self):
        if self.request.method in ['GET', 'PUT', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return []
    def get(self, request, *args, **kwargs):
            alumno = Alumnos.objects.filter(id=request.GET.get("id"), user__is_active=1).first()
            if not alumno:
                return Response({"message": "Alumno no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            serializer = AlumnoSerializer(alumno)
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    # Registrar nuevo alumno con los campos del Proyecto Final
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
                return Response({"message":"Username "+email+", is already taken"}, 400)

            user = User.objects.create(username=email,
                                       email=email,
                                       first_name=first_name,
                                       last_name=last_name,
                                       is_active=1)

            user.save()
            user.set_password(password)
            user.save()

            group, created = Group.objects.get_or_create(name=role)
            group.user_set.add(user)
            user.save()

            # MAPEO DE LOS NUEVOS CAMPOS (direccion y sexo)
            alumno = Alumnos.objects.create(user=user,
                                            matricula=request.data["matricula"],
                                            curp=request.data["curp"].upper(),
                                            rfc=request.data["rfc"].upper(),
                                            fecha_nacimiento=request.data["fecha_nacimiento"],
                                            edad=request.data["edad"],
                                            telefono=request.data["telefono"],
                                            ocupacion=request.data["ocupacion"],
                                            direccion=request.data.get("direccion"),  # <-- Nuevo
                                            sexo=request.data.get("sexo"))            # <-- Nuevo
            alumno.save()

            return Response({"Alumno creado con ID= ": alumno.id }, 201)

        return Response(user.errors, status=status.HTTP_400_BAD_REQUEST)

    # Editar alumno con los campos del Proyecto Final
    def put(self, request, *args, **kwargs):
        item_id = request.query_params.get('id') or request.data.get('id')
        
        if not item_id:
            return Response({"error": "Falta el ID para editar"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            perfil = Alumnos.objects.get(id=item_id)
            user = perfil.user 
            
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            user.save()

            if 'telefono' in request.data:
                perfil.telefono = request.data['telefono']
            if 'edad' in request.data:
                perfil.edad = request.data['edad']
            if 'ocupacion' in request.data:
                perfil.ocupacion = request.data['ocupacion']
            if 'direccion' in request.data:                  # <-- Nuevo
                perfil.direccion = request.data['direccion']
            if 'sexo' in request.data:                       # <-- Nuevo
                perfil.sexo = request.data['sexo']
            
            perfil.save()
            return Response({"message": "Registro actualizado exitosamente"}, status=status.HTTP_200_OK)
            
        except Alumnos.DoesNotExist:
            return Response({"error": "El registro no existe en la base de datos"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, *args, **kwargs):
        alumno_id = request.query_params.get('id')
        if not alumno_id:
            return Response({"error": "Falta el ID del alumno"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            alumno = Alumnos.objects.get(id=alumno_id)
            user = alumno.user
            alumno.delete()
            user.delete()
            return Response({"message": "Alumno eliminado físicamente de la base de datos"}, status=status.HTTP_200_OK)
        except Alumnos.DoesNotExist:
            return Response({"error": "El alumno no existe"}, status=status.HTTP_404_NOT_FOUND)


class AlumnosAll(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        alumnos = Alumnos.objects.all().order_by('id')
        alumnos_list = []
        
        for alumno in alumnos:
            alumnos_list.append({
                "id": alumno.id,
                "matricula": alumno.matricula,
                "first_name": alumno.user.first_name,
                "last_name": alumno.user.last_name,
                "email": alumno.user.email,
                "curp": alumno.curp,
                "rfc": alumno.rfc,
                "edad": alumno.edad,
                "telefono": alumno.telefono,
                "ocupacion": alumno.ocupacion,
                "direccion": alumno.direccion,  # <-- Enviado a Angular
                "sexo": alumno.sexo             # <-- Enviado a Angular
            })
            
        return Response(alumnos_list, status=status.HTTP_200_OK)