# Stage 1: Builder
# This stage installs dependencies and generates protobuf files.
FROM python:3.11-slim AS builder

# Set the working directory
WORKDIR /app

# Install build-time dependencies needed for compiling some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Copy only the requirements file first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY ./src ./src
COPY ./proto ./proto

# Generate gRPC code from .proto file
RUN python -m grpc_tools.protoc \
    -I./proto \
    --python_out=./src \
    --grpc_python_out=./src \
    ./proto/auth.proto

# Stage 2: Final Image
# This stage creates the final, lean image with only the necessary files.
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN useradd --create-home appuser
USER appuser

# Copy installed Python packages from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
# Copy generated protobuf files and source code from the builder stage
COPY --from=builder /app/src ./src

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 50051

# Run the application
CMD ["python", "src/server.py"]