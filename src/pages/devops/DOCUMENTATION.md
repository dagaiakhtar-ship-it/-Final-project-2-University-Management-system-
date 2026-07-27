# Smart University ERP - DevOps, Orchestration & Monitoring Documentation

This document covers all 10 modules of the Enterprise DevOps, Monitoring, Logging, and Recovery Architecture.

---

## 1. Docker Documentation

The application is containerized using a multi-stage `Dockerfile` to produce optimized, production-grade Node.js images.

```dockerfile
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Execution Image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

---

## 2. Docker Compose Documentation

Docker Compose orchestrates the core web application, PostgreSQL database, and Redis background workers in development and sandbox environments.

```yaml
version: '3.8'

services:
  smart-university-erp:
    build:
      context: .
      dockerfile: Dockerfile
    image: smart-university/erp:latest
    container_name: smart-erp-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:secret@postgres:5432/postgres
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:15-alpine
    container_name: smart-erp-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: smart-erp-cache
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
```

---

## 3. Kubernetes Deployment Guide

This guide describes how to deploy the ERP core as a highly available, load-balanced service inside a Kubernetes Cluster.

### Core YAML Deployment & Service Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erp-deployment
  namespace: smart-campus
  labels:
    app: erp-core
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: erp-core
  template:
    metadata:
      labels:
        app: erp-core
    spec:
      containers:
      - name: erp-app
        image: smart-university/erp:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: database-url
        resources:
          limits:
            cpu: "1"
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: erp-service
  namespace: smart-campus
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: erp-core
```

---

## 4. GitHub Actions Workflow

This workflow automates building, linting, testing, Docker image creation, and deployment triggers upon repository push events.

```yaml
name: CI/CD Production Pipeline

on:
  push:
    branches: [ main, release/* ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run Linter
      run: npm run lint

    - name: Run Prisma Migrations Validation
      run: npx prisma validate

    - name: Compile Application
      run: npm run build

  docker-build-push:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3

    - name: Set up QEMU
      uses: docker/setup-qemu-action@v2

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and Push Docker Image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ghcr.io/smart-university/erp:latest
```

---

## 5. Infrastructure Architecture

The ERP system relies on an enterprise-grade cloud-native framework:
1. **Load Balancer**: GKE Ingress/AWS ALB routing HTTPS traffic.
2. **Reverse Proxy / Gateway**: Nginx routing requests, managing SSL termination and proxying to port 3000.
3. **Application Layer**: Auto-scaling Node.js/Express pods running inside a Docker runtime environment.
4. **Caching Layer**: Redis/BullMQ orchestrator managing background job dispatches and caching active sessions.
5. **Database Layer**: Highly available, replicated PostgreSQL database with automatic point-in-time recovery.

---

## 6. Monitoring Architecture

Continuous systems inspection is powered by Prometheus and Grafana:
- **Metrics Scraping**: Prometheus pulls gauges from `/metrics` on target clusters.
- **Node Monitoring**: Node exporter captures memory footprint, network I/O, and CPU load.
- **Alertmanager**: Dispatches critical notifications (PagerDuty/Slack/Email) if CPU > 85% or database latency > 500ms.

---

## 7. Logging Architecture

Log aggregation is unified using Loki and Winston/Morgan:
- **Console Output**: Structured JSON stdout logs emitted by Express/Winston.
- **Loki Collector**: Promtail agents stream Docker stdout logs to a central Grafana Loki cluster.
- **Visual Log Viewer**: Integrated into the DevOps Dashboard to query log streams in real-time.

---

## 8. Backup & Disaster Recovery Guide

- **Database Backups**: Periodic pg_dump operations triggered every 24 hours. Securely compressed and pushed to multi-region cloud buckets.
- **Media Backups**: Differential synchronization of asset assets with cold glacier storage every night.
- **RTO / RPO Objectives**:
  - Recovery Time Objective (RTO): < 30 minutes to spin up a fully restored mirror cluster.
  - Recovery Point Objective (RPO): < 4 hours (maximum age of backup restoration).

---

## 9. Entity-Relationship (ER) Diagram

```
+-----------------------------------------------------------+
|                        DEPLOYMENT                         |
+-----------------------------------------------------------+
| id          : Int (PK, AutoIncrement)                     |
| version     : String                                      |
| environment : String ("Development", "Staging", "Prod")   |
| deployedBy  : String                                      |
| deployedAt  : DateTime                                    |
| status      : String ("Running", "Failed", "RolledBack")  |
+-----------------------------------------------------------+

+-----------------------------------------------------------+
|                    ENVIRONMENTVARIABLE                    |
+-----------------------------------------------------------+
| id             : Int (PK, AutoIncrement)                  |
| key            : String                                   |
| valueEncrypted : String                                   |
| environment    : String                                   |
| active         : Boolean                                  |
+-----------------------------------------------------------+

+-----------------------------------------------------------+
|                          BACKUP                           |
+-----------------------------------------------------------+
| id              : Int (PK, AutoIncrement)                 |
| backupType      : String ("Database", "Media", "Config")  |
| storageLocation : String                                  |
| createdAt       : DateTime                                |
| completedAt     : DateTime?                               |
| status          : String ("Pending", "Completed")         |
+-----------------------------------------------------------+

+-----------------------------------------------------------+
|                    INFRASTRUCTUREALERT                    |
+-----------------------------------------------------------+
| id        : Int (PK, AutoIncrement)                       |
| severity  : String ("Low", "Medium", "High", "Critical")   |
| source    : String ("Server", "Database", "Queue", etc)   |
| message   : String                                        |
| resolved  : Boolean                                       |
| createdAt : DateTime                                      |
+-----------------------------------------------------------+
```

---

## 10. Folder Structure

```
smart-university-erp/
├── prisma/
│   ├── schema.prisma            <-- Database Schemas with DevOps Models
│   └── seed.ts                  <-- Preseed and Seeding Actions
├── src/
│   ├── api/
│   │   └── api-client.ts        <-- Core API Client Instance
│   ├── components/
│   │   └── dashboard/
│   │       └── Sidebar.tsx      <-- Sidebar Panel Navigation links
│   ├── constants/
│   │   └── routes.constants.ts  <-- Route constant definitions
│   ├── pages/
│   │   └── devops/
│   │       ├── DevopsPage.tsx   <-- Unified DevOps Control Panel Page
│   │       └── DOCUMENTATION.md <-- DevOps, Orchestration & Monitoring Docs
│   ├── routes/
│   │   ├── index.tsx            <-- App Navigation Routing setup
│   │   └── devops.routes.ts     <-- Express Endpoint handlers
│   └── services/
│       ├── db.service.ts        <-- Core Prisma Connection
│       └── socket.service.ts    <-- Real-time websocket dispatches
├── server.ts                    <-- Main FullStack Server entry point
└── package.json                 <-- Dependency modules & scripts
```
