#!/bin/bash
# Sử dụng: ./scripts/rollback.sh <previous_image_tag>
# Ví dụ:   ./scripts/rollback.sh abc123def

set -e
TAG=${1:?"Usage: $0 <image_tag>"}
cd ~/smart-ticketing

echo "Rolling back to tag: $TAG..."
sed -i "s/^DEPLOY_TAG=.*/DEPLOY_TAG=$TAG/" .env

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

echo "Waiting for health check..."
sleep 15
curl -sf http://localhost/api/v1/health && echo "Rollback thành công!" || echo "Rollback thất bại!"
