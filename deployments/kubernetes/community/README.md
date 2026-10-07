# AslanBoard on Kubernetes

The Gopalu Vagrant VM (`/root/vagrant/Plane`) runs Plane CE v1.4.2 in Docker Compose. This chart is that same stack: official Plane images, the custom frontend `aslanboard/plane-frontend:v1.4.2-aslan`, and MinIO from Quay because Docker Hub removed `minio/minio`.

Plane publishes a separate community chart on Artifact Hub. It does not pin this frontend image or the Quay MinIO tag, so the install on Gopalu uses the chart in this directory.

## Layout

Kubernetes namespace: `aslanboard` (namespace names must be lowercase).

| Port       | What                         |
| ---------- | ---------------------------- |
| 8071       | This chart, HTTP only.       |
| 443 / 8007 | Host nginx, proxied to 8071. |

The Vagrant VM in `/root/vagrant/Plane` is stopped. External traffic for `aslanboard.aslaniya.com` goes to this namespace.

## Install

Images are imported into the node containerd from the VM (`imagePullPolicy: IfNotPresent`). The web image is not on Docker Hub.

Secrets stay on the server. Build them from the VM `plane.env` and create `aslanboard-env` before install. The secret must define `POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`, `SECRET_KEY`, `LIVE_SERVER_SECRET_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, plus `DATABASE_URL` and `AMQP_URL` (those two are blank in `plane.env`; Compose fills them from the password defaults).

```bash
kubectl create namespace aslanboard
kubectl -n aslanboard create secret generic aslanboard-env --from-env-file=aslanboard.secret.env
helm upgrade --install aslanboard ./deployments/kubernetes/community/aslanboard \
  --namespace aslanboard
```

Then restore `pg_dump` from the VM into `plane-db` and copy the MinIO `uploads` volume. Restart `api`, `worker`, and `beat-worker` after the restore.
