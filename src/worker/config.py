import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "admin")
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "admin123")

QUEUE_NAME = "ticket.process.queue"

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# PostgreSQL
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", 5432))
POSTGRES_DB = os.getenv("POSTGRES_DB", "ticketing_db")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres_admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "SecretDBPass2026!")

# Redis
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
