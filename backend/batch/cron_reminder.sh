#!/bin/bash
# Railway Cron: 毎日 8:00 JST (23:00 UTC 前日) に実行
curl -X POST \
  -H "Authorization: Bearer $BATCH_SECRET_KEY" \
  https://$RAILWAY_PUBLIC_DOMAIN/api/batch/reminder
