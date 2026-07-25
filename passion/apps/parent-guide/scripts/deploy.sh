#!/usr/bin/env bash
# Build the static export and push it to AWS Amplify Hosting as a manual deployment.
#
# Usage:
#   AWS_PROFILE=sbsandbox AWS_REGION=us-east-1 APP_ID=d1a4ymdb4o77jv ./scripts/deploy.sh
#
# The first deploy created the app; reuse its APP_ID to update in place. The live URL is
# https://main.$APP_ID.amplifyapp.com. Requires the aws CLI, curl, and python3 (for zipping,
# since `zip` is not installed in this environment).
set -euo pipefail

APP_ID="${APP_ID:-d1a4ymdb4o77jv}"
BRANCH="${BRANCH:-main}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="$AWS_REGION"

here="$(cd "$(dirname "$0")/.." && pwd)"
cd "$here"

echo "==> Building static export"
pnpm exec next build

echo "==> Zipping out/ -> deploy.zip"
python3 - <<'PY'
import zipfile, os
root, out = "out", "deploy.zip"
if os.path.exists(out): os.remove(out)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for dp, _, fs in os.walk(root):
        for f in fs:
            fp = os.path.join(dp, f)
            z.write(fp, os.path.relpath(fp, root))
print("  entries:", len(zipfile.ZipFile(out).namelist()))
PY

echo "==> Creating deployment on app $APP_ID / branch $BRANCH"
read -r JOB URL < <(aws amplify create-deployment --app-id "$APP_ID" --branch-name "$BRANCH" \
  --query '[jobId,zipUploadUrl]' --output text)
echo "  jobId=$JOB"

echo "==> Uploading zip"
curl -sf -H "Content-Type: application/zip" --upload-file deploy.zip "$URL" -o /dev/null
echo "  uploaded"

echo "==> Starting deployment"
aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB" \
  --query 'jobSummary.status' --output text

echo "==> Waiting for it to finish"
while :; do
  ST="$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB" \
    --query 'job.summary.status' --output text)"
  echo "  $ST"
  case "$ST" in SUCCEED) break;; FAILED|CANCELLED) echo "deploy $ST"; exit 1;; esac
  sleep 6
done

echo "==> Live: https://$BRANCH.$APP_ID.amplifyapp.com"
