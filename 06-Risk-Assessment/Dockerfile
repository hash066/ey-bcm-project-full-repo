FROM python:3.10-slim

RUN mkdir -p /data/huggingface && chmod -R 777 /data/huggingface

ENV HF_HOME=/data/huggingface

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
