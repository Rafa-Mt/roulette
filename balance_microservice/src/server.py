import grpc
from concurrent import futures
import balance_pb2_grpc
from dotenv import load_dotenv
from service.service import BalanceService

load_dotenv()

def serve():
  server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

  balance_pb2_grpc.add_BalanceServiceServicer_to_server(
    BalanceService(),
    server
  )

  server.add_insecure_port("[::]:50051")

  server.start()
  print("Servidor de balance escuchando en el puerto 50051...")

  server.wait_for_termination()

if __name__ == "__main__":
  serve()