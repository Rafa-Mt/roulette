from service.db import add_balance, get_balance_by_user, update_balance, Balance
from balance_pb2 import AddBalanceResponse, GetBalanceByUserResponse, UpdateBalanceResponse

class BalanceService:
  def AddBalance(self, request, context):
      user_id = request.user_id
      amount = request.amount
      new_balance = add_balance(user_id=user_id, balance=amount)

      if not new_balance:
          return AddBalanceResponse(success=False, message="No se pudo agregar el balance", balance=0.0)

      return AddBalanceResponse(success=True, message="Balance agregado exitosamente", balance=float(new_balance.balance))

  def GetBalanceByUser(self, request, context):
      user_id = request.user_id
      balance = get_balance_by_user(user_id=user_id)

      if not balance:
          return GetBalanceByUserResponse(success=False, message="No se encontró el balance", balance=0.0)

      return GetBalanceByUserResponse(success=True, message="Balance encontrado", balance=float(balance.balance))

  def UpdateBalance(self, request, context):
      print(request)
      user_id = request.user_id
      amount = request.amount
      updated_balance: Balance = update_balance(user_id=user_id, amount=amount)

      if not updated_balance:
          return UpdateBalanceResponse(success=False, message="No se pudo actualizar el balance", balance=0.0)

      return UpdateBalanceResponse(success=True, message="Balance actualizado exitosamente", balance=float(updated_balance.balance))
