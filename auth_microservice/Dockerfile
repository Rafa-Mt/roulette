FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --user --no-cache-dir "streamlit>=1.44.0" && \
    pip install --user --no-cache-dir psycopg2-binary

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

COPY . .

COPY .env .env

RUN python -m grpc_tools.protoc \
    -I./proto \
    --python_out=./src \
    --grpc_python_out=./src \
    ./proto/auth.proto

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
COPY --from=builder /app/src /app/src
COPY --from=builder /app/proto /app/proto

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PATH=/root/.local/bin:$PATH

EXPOSE 50051

CMD ["python", "src/server.py"]