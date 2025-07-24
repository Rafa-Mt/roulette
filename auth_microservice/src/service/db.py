from functools import wraps
from sqlalchemy import create_engine, Table, MetaData, engine, select, DateTime
from sqlalchemy.exc import OperationalError, IntegrityError
from os import getenv
from pydantic import BaseModel
from uuid import UUID

class User(BaseModel):
    id: UUID | str
    username: str
    email: str
    password: str

pg = create_engine(
    f"postgresql://{getenv('POSTGRES_USER')}:{getenv('POSTGRES_PASSWORD')}@{getenv('POSTGRES_HOST')}:{getenv('POSTGRES_PORT')}/{getenv('POSTGRES_DB')}"
)

metadata = MetaData()

users = Table("user", metadata=metadata, autoload_with=pg)
balances = Table("balances", metadata=metadata, autoload_with=pg)

Connection = engine.Connection

def query(func):
  @wraps(func)
  def wrapper(*args, **kwargs):
      try:
          with pg.connect() as conn:
              with conn.begin():
                  return func(conn, *args, **kwargs)
      except IntegrityError as e:
          print(f"IntegrityError occurred: {e}")
      except OperationalError as e:
          print(f"OperationalError occurred: {e}")

  return wrapper


@query
def new_user(conn: Connection | None, username: str, email: str, password: str):
    
    existing = conn.execute(
        select(users.c.id).where(users.c.email == email)
    ).fetchone()
    if existing:
        raise ValueError("El email ya está registrado")

    result = conn.execute(users.insert().values(username=username, email=email, password=password).returning(users.c.id))

    return User.model_validate({
        "id": result.fetchone()._asdict()["id"],
        "username": username,
        "email": email,
        "password": password
    })

def get_user_by_email(conn: Connection | None, email: str) -> User | None:
    row = conn.execute(
        select(users.c.id, users.c.username, users.c.email) \
        .where(users.c.email == email)
    ).fetchone()
    return User.model_validate(row._asdict()) if row else None

@query
def get_user_by_id(conn: Connection | None, user_id: UUID) -> User | None:
    row =  conn.execute(
        select(users.c.id, users.c.username, users.c.email) \
        .where(users.c.id == user_id)
    ).fetchone()
    return User.model_validate(row._asdict()) if row else None