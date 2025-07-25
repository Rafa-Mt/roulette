from functools import wraps
from sqlalchemy import create_engine, Table, MetaData, engine, select, DateTime
from sqlalchemy.exc import OperationalError, IntegrityError
from os import getenv
from pydantic import BaseModel
from uuid import UUID
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


class User(BaseModel):
    id: UUID | str
    username: str
    password: str


pg_port = getenv("POSTGRES_PORT") or "5432"

pg = create_engine(
    f"postgresql://{getenv('POSTGRES_USER')}:{getenv('POSTGRES_PASSWORD')}@{getenv('POSTGRES_HOST')}:{int(pg_port)}/{getenv('POSTGRES_DB')}"
)

metadata = MetaData()

metadata.reflect(bind=pg)

users = metadata.tables["users"]
balances = metadata.tables["balances"]

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
def new_user(conn: Optional[Connection], username: str, password: str) -> User:
    if not conn:
        raise ValueError("Connection is required to create a new user")
    result = conn.execute(
        users.insert()
        .values(username=username, password=password)
        .returning(users.c.user_id, users.c.username)
    )

    row = result.fetchone()

    if not row:
        raise ValueError("No se pudo crear el usuario")

    return User(id=str(row.user_id), username=row.username, password=password)


@query
def get_user_by_username(conn: Optional[Connection], username: str) -> User | None:
    if not conn:
        raise ValueError("Connection is required to get user by username")

    try:
        row = conn.execute(
            users.select().where(users.c.username.ilike(username.strip().lower()))
        ).fetchone()
        if not row:
            return None
        return User(id=str(row.user_id), username=row.username, password=row.password)
    except Exception as e:
        print(f"Error al consultar el usuario por username: {e}")
        raise ValueError("No se pudo consultar el usuario por username")


@query
def get_user_by_id(conn: Optional[Connection], user_id: UUID) -> User | None:
    if not conn:
        raise ValueError("Connection is required to get user by ID")

    row = conn.execute(select().where(users.c.id == user_id)).fetchone()
    return User.model_validate(row._asdict()) if row else None
