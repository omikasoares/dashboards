#!/bin/bash
set -e

cd /root/projects/dashboards

git pull --ff-only origin main

docker build -t dashboards:latest .

docker service update --force dashboards_dashboards
