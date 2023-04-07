FROM python:3.11.2-bullseye

WORKDIR /app

ENV REDIS_PORT=6379
ENV OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4317/
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5000

COPY requirements.txt .
COPY app.py  .

RUN apt-get update -y && \
    apt-get install -y bind9-utils curl && \
    pip install --no-cache-dir -r requirements.txt

RUN pip install opentelemetry-distro && \
    pip install opentelemetry-exporter-otlp && \
    pip install opentelemetry-exporter-otlp-proto-http && \
    opentelemetry-bootstrap -a install

CMD opentelemetry-instrument \
    --traces_exporter otlp \
    --metrics_exporter otlp \
    --service_name skillsets \
    flask run