from os import getenv
import jwt
import bcrypt
from service.db import User, new_user, get_user_by_email, pg
from service.redis import session_storage
from uuid import uuid4
from auth_pb2 import LoginResponse, RegisterResponse

class AuthService:
  def Login(self, request, response):
      user = get_user_by_email(email=request.email)

      if not user:
          print("No se encontro el usuario")
          return LoginResponse(success=False, token=None)

      if not bcrypt.checkpw(request.password.encode("utf-8"), user.password.encode("utf-8")):
          print("Contraseña incorrecta")
          return LoginResponse(success=False, token=None)

      # token = jwt.encode({"user_id": user.id}, getenv("JWT_SECRET"), algorithm="HS256")
      redis_token = str(uuid4())
      session_storage.set(f"session:{redis_token}", user.id)
      return LoginResponse(success=True, token=redis_token)

  def Register(self, request, response):
      user = get_user_by_email(email=request.email)
      if user:
          return RegisterResponse(success=False, message="Usuario ya existe")

      hashed_password = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
      u: User | None = new_user(username=request.username, email=request.email, password=hashed_password)

      redis_token = str(uuid4())
      session_storage.set(f"session:{redis_token}", u.id)
      return RegisterResponse(success=True, message="Registro exitoso")

  def ValidateToken(self, request, response):
      user_id = session_storage.get(f"session:{request.token}")
      if not user_id:
          return LoginResponse(success=False, message="Token inválido")

      return LoginResponse(success=True, user_id=user_id)