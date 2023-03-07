FROM python:alpine3.16

WORKDIR /app

ENV REDIS_PORT=6379

COPY requirements.txt .
RUN pip install -r requirements.txt  && \
    apk update && \
    apk add bind-tools curl
    
COPY app.py  .

CMD flask run -h 0.0.0.0 -p 5000