from functools import wraps
from sqlalchemy import create_engine, Table, MetaData, engine, select, DateTime
from sqlalchemy.exc import OperationalError, IntegrityError
from os import getenv
from pydantic import BaseModel
from uuid import UUID
from dotenv import load_dotenv

load_dotenv()

class Balance(BaseModel):
    id: UUID | str
    user_id: UUID | str
    balance: float

pg_port = getenv('POSTGRES_PORT') or '5432'

pg = create_engine(
    f"postgresql://{getenv('POSTGRES_USER')}:{getenv('POSTGRES_PASSWORD')}@{getenv('POSTGRES_HOST')}:{int(pg_port)}/{getenv('POSTGRES_DB')}"
)

metadata = MetaData()

metadata.reflect(bind=pg)

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
def add_balance(conn: Connection, user_id: str, balance: float) -> Balance:
    result = conn.execute(
        balances.insert().values(
            user_id=user_id,
            balance=balance
        ).returning(balances.c.balance_id, balances.c.user_id, balances.c.balance)
    )
    
    row = result.fetchone()

    if not row:
        raise ValueError("No se pudo agregar el balance")

    return Balance(
        id=str(row.balance_id),
        user_id=str(row.user_id),
        balance=row.balance
    )

@query
def get_balance_by_user(conn: Connection, user_id: str) -> Balance | None:
    try:
        row = conn.execute(
            balances.select().where(
                balances.c.user_id == user_id
            )
        ).fetchone()
        if not row:
            return None
        return Balance(
            id=str(row.balance_id),
            user_id=str(row.user_id),
            balance=row.balance
        )
    except Exception as e:
        print(f"Error al consultar el balance por user_id: {e}")
        raise ValueError("No se pudo consultar el balance por user_id")

@query
def update_balance(conn: Connection, user_id: str, amount: float) -> Balance | None:
    result = conn.execute(
        balances.update().where(
            balances.c.user_id == user_id
        ).values(balance=amount).returning(balances.c.balance_id, balances.c.user_id, balances.c.balance)
    )

    row = result.fetchone()

    if not row:
        return None

    return Balance(
        id=str(row.balance_id),
        user_id=str(row.user_id),
        balance=row.balance
    )