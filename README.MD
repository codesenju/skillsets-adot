

## Add an engineer with name "Bob" and skills "Python, SQL, Flask" using a POST request:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"name": "Alice", "skills": "Python, SQL, Flask"}' http://localhost:5000/add_engineer
```
## Retrieve the skills for an engineer with name "Bob" using a GET request:
```bash
curl "http://localhost:5000/get_skills?name=Alice"
```
## Retrieve the skills for all engineers using a GET request:
```bash
curl http://localhost:5000/get_all_engineers
```
## Update
```bash
curl -X PUT -H "Content-Type: application/json" -d '{"skills": "Python, Flask, Django"}' http://localhost:5000/update_engineer_skillset/Alice
```
## Delete
```bash
curl -X DELETE http://localhost:5000/delete_engineer/Alice
```

# OpenTelemetry

### Configuring the agent 
```bash
opentelemetry-instrument \
    --traces_exporter console,otlp \
    --metrics_exporter console \
    --service_name skillsets \
    --exporter_otlp_endpoint 0.0.0.0:4317 \
    python app.py
```
```bash
opentelemetry-instrument \
    --traces_exporter console \
    --metrics_exporter console \
    flask run
```
```bash
docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 14250:14250 \
  -p 9411:9411 \
  jaegertracing/all-in-one:latest
```
## Multi Arch Build
```bash
docker buildx build --push  --platform=linux/amd64,linux/arm64 -t codesenju/skillsets-api:latest .
```
## React UI
```bash
export REACT_APP_API_ENDPOINT=https://uat-skillsets.lmasu.co.za

export REACT_APP_API_ENDPOINT=http://localhost:5000

npm start
```

# Reference:
- https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/jaegerexporter
- https://www.stacksimplify.com/aws-eks/aws-devops-eks/learn-to-master-devops-on-aws-eks-using-aws-codecommit-codebuild-codepipeline/