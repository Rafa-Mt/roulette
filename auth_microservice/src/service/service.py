from os import getenv
import redis
import jwt
import bcrypt
from auth_microservice.src.service.db import User, new_user, get_user_by_email
from auth_microservice.src.service.redis import session_storage
from uuid import uuid4
from auth_microservice.src.auth_pb2 import LoginResponse, RegisterResponse

class AuthService:
  def Login(self, request, response):
      user = get_user_by_email(request.email)
      if not user:
          raise ValueError("Usuario no encontrado")

      if not bcrypt.checkpw(request.password.encode("utf-8"), user.password.encode("utf-8")):
          raise ValueError("Contraseña incorrecta")

      token = jwt.encode({"user_id": user.id}, getenv("JWT_SECRET"), algorithm="HS256")
      session_storage.set(f"session:{token}", user.id)
      return LoginResponse(success=True, token=token)

  def Register(self, request, response):
      user = get_user_by_email(request.email) is not None
      if user:
          return RegisterResponse(success=False, message="Usuario ya existe")

      hashed_password = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt())
      u: User | None = new_user(email=request.email, password=hashed_password)

      redis_token = str(uuid4())
      session_storage.set(f"session:{redis_token}", u.id)
      return RegisterResponse(success=True, message="Registro exitoso")