FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and alembic
COPY . .

# Copy ML artifacts into container
COPY ../ml/artifacts /ml/artifacts

ENV PYTHONPATH=/app
ENV ML_ARTIFACTS_DIR=/ml/artifacts
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
