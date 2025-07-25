import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Define the service response types based on your proto file
interface LoginResponse {
  success: boolean;
  token: string | null;
  message?: string;
  balance?: number; // Optional balance for the user
}

interface RegisterResponse {
  success: boolean;
  token: string;
  message?: string; // Optional message for success or failure
  balance?: number; // Optional balance for the user
}

interface ValidateTokenResponse {
  success: boolean;
  user_id?: number;
  message?: string;
}

// Define the service client interface
interface AuthServiceClient {
  Login(
    request: { username: string; password: string },
    callback: (error: grpc.ServiceError | null, response: LoginResponse) => void
  ): void;
  Register(
    request: { username: string; password: string },
    callback: (
      error: grpc.ServiceError | null,
      response: RegisterResponse
    ) => void
  ): void;
  ValidateToken(
    request: { token: string },
    callback: (
      error: grpc.ServiceError | null,
      response: ValidateTokenResponse
    ) => void
  ): void;
}

// Define the service constructor interface
interface AuthServiceConstructor {
  new (
    address: string,
    credentials: grpc.ChannelCredentials
  ): AuthServiceClient;
}

// Define the proto package interface
interface ProtoDescriptor {
  auth: {
    AuthService: AuthServiceConstructor;
  };
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROTO_PATH = join(__dirname, "../proto/auth.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(
  packageDefinition
) as unknown as ProtoDescriptor;
const auth = protoDescriptor.auth;

const client = new auth.AuthService(
  process.env.AUTH_SERVICE_URL || "localhost:50051",
  grpc.credentials.createInsecure()
);

export const login = (username: string, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    client.Login({ username, password }, (error: any, response: LoginResponse) => {
      if (error) reject(error);
      resolve(response);
    });
  });
};

export const register = (
  username: string,
  password: string
): Promise<RegisterResponse> => {
  return new Promise((resolve, reject) => {
    client.Register(
      { username, password },
      (error: any, response: RegisterResponse) => {
        if (error) reject(error);
        resolve(response);
      }
    );
  });
};

export const validateToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    client.ValidateToken({ token }, (error: any, response: any) => {
      if (error) reject(error);
      resolve(response);
    });
  });
};
