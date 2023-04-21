## End of the day
```bash
kubectl delete hpa redis skillsets && \
kubectl -n api scale sts pgmoviedb --replicas 0 && \
kubectl -n skillsets scale deploy skillsets --replicas 0 && \
kubectl -n skillsets scale sts redis --replicas 0 && \
kubectl scale deploy my-collector-cloudwatch-collector --replicas 0 -n opentelemetry-operator-system
```