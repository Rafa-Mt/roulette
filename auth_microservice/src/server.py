import grpc
from concurrent import futures
from service.service import AuthService
import auth_pb2_grpc
from dotenv import load_dotenv

load_dotenv()

def serve():

  server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

  auth_pb2_grpc.add_AuthServiceServicer_to_server(
    AuthService(),
    server
  )

  server.add_insecure_port('[::]:50052')

  server.start()
  print("gRPC Server started on port 50052...")

  server.wait_for_termination()

if __name__ == '__main__':
  serve()