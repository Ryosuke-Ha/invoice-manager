#!/bin/bash
# Railway Cron: 毎日 9:00 JST (00:00 UTC) に実行
curl -X POST \
  -H "Authorization: Bearer $BATCH_SECRET_KEY" \
  https://$RAILWAY_PUBLIC_DOMAIN/api/batch/freee-sync
