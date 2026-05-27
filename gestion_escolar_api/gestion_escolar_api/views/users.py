from django.db.models import *
from django.db import transaction
from gestion_escolar_api.models import Administradores, Maestros, Alumnos
from gestion_escolar_api.serializers import UserSerializer
from gestion_escolar_api.serializers import *
from gestion_escolar_api.models import *
from rest_framework import permissions
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth.models import Group

class AdminAll(generics.ListAPIView):
    #Esta función es esencial para todo donde se requiera autorización de inicio de sesión (token)
    permission_classes = (permissions.IsAuthenticated,)
    # Invocamos la petición GET para obtener todos los administradores
    def get(self, request, *args, **kwargs):
        admin = Administradores.objects.filter(user__is_active = 1).order_by("id")
        lista = AdminSerializer(admin, many=True).data
        return Response(lista, 200)
    
class AdminView(generics.CreateAPIView):
    # Permisos por método (sobrescribe el comportamiento default)
    def get_permissions(self):
        if self.request.method in ['GET', 'PUT', 'DELETE', 'PATCH']:
            return [permissions.IsAuthenticated()]
        return []  # POST no requiere autenticación
    
    #Obtener un administrador específico por su ID
    def get(self, request, *args, **kwargs):
        admin = Administradores.objects.filter(id=request.GET.get("id"), user__is_active=1).first()
        if not admin:
            return Response({"message": "Administrador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminSerializer(admin)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    #Registrar nuevo usuario administrador
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
                return Response({"message":"Nombre de usuario "+email+", ya existe"},400)

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

            #Almacenar los datos adicionales con los NUEVOS CAMPOS
            admin = Administradores.objects.create(user=user,
                                            clave_admin= request.data["clave_admin"],
                                            telefono= request.data["telefono"],
                                            rfc= request.data["rfc"].upper(),
                                            edad= request.data["edad"],
                                            ocupacion= request.data["ocupacion"],
                                            categoria= request.data.get("categoria"),         # <-- Nuevo
                                            grado_academico= request.data.get("grado_academico")) # <-- Nuevo
            admin.save()

            return Response({"Administrador creado ID": admin.id }, 201)

        return Response(user.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Actualizar datos del administrador
    @transaction.atomic
    def put(self, request, *args, **kwargs):
        admin = Administradores.objects.filter(id=request.data["id"], user__is_active=1).first()
        if not admin:
            return Response({"message": "Administrador no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        user = admin.user
        
        if 'first_name' in request.data:
            user.first_name = request.data["first_name"]
        if 'last_name' in request.data:
            user.last_name = request.data["last_name"]
        user.save()

        # Actualizar campos del administrador (con los NUEVOS CAMPOS)
        if 'clave_admin' in request.data:
            admin.clave_admin = request.data["clave_admin"]
        if 'telefono' in request.data:
            admin.telefono = request.data["telefono"]
        if 'rfc' in request.data:
            admin.rfc = request.data["rfc"].upper()
        if 'edad' in request.data:
            admin.edad = request.data["edad"]
        if 'ocupacion' in request.data:
            admin.ocupacion = request.data["ocupacion"]
        if 'categoria' in request.data:                           # <-- Nuevo
            admin.categoria = request.data["categoria"]
        if 'grado_academico' in request.data:                     # <-- Nuevo
            admin.grado_academico = request.data["grado_academico"]
            
        admin.save()

        return Response({"message": "Administrador actualizado correctamente"}, status=status.HTTP_200_OK)
    
    #Función para eliminar un administrador específico por su ID
    @transaction.atomic
    def delete(self, request, *args, **kwargs):
        admin = Administradores.objects.filter(id=request.GET.get("id"), user__is_active=1).first()
        if not admin:
            return Response({"message": "Administrador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        try:
            admin.user.delete()
            return Response({"details":"Administrador eliminado"},200)
        except Exception as e:
            return Response({"details":"Error al eliminar administrador"},400)
        
    #Función para desactivar un administrador específico por su ID
    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        admin = Administradores.objects.filter(id=request.data["id"], user__is_active=1).first()
        if not admin:
            return Response({"message": "Administrador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        try:
            admin.user.is_active = False
            admin.user.save()
            return Response({"details":"Administrador desactivado"},200)
        except Exception as e:
            return Response({"details":"Error al desactivar administrador"},400)

class TotalUsuarios(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    def get(self, request, *args, **kwargs):
        total_admins = Administradores.objects.filter(user__is_active=1).count()
        total_maestros = Maestros.objects.filter(user__is_active=1).count()
        total_alumnos = Alumnos.objects.filter(user__is_active=1).count()
        try:
            return Response({
                "total_admins": total_admins,
                "total_maestros": total_maestros,
                "total_alumnos": total_alumnos
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"details":"Error al obtener el total de usuarios"},400)