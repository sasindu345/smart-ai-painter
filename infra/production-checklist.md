# Production Deployment Checklist

Use this checklist before and after every deployment.

## 1) Validate GitHub Secrets

Confirm these are set and not placeholders like `-`:

- `APP_DOMAIN`
- `AI_MODE`
- `HF_API_TOKEN`
- `HF_MODEL_ID`
- `HF_TIMEOUT_SECONDS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_STORAGE_BUCKET`

Expected key values:

- `HF_MODEL_ID=stabilityai/stable-diffusion-xl-base-1.0`
- `SUPABASE_STORAGE_BUCKET=generated-images`

## 2) Run Deploy Workflow

Push to `main` or manually run deploy workflow.

Confirm the deploy workflow completed successfully.

## 3) Verify Runtime Env on VPS

```bash
grep -E "^(APP_DOMAIN|AI_MODE|HF_MODEL_ID|SUPABASE_STORAGE_BUCKET)=" /opt/smart-ai-painter/.env.prod
```

## 4) Verify Containers and Versions

```bash
docker compose --env-file /opt/smart-ai-painter/.env.prod -f /opt/smart-ai-painter/infra/docker-compose.prod.yml ps

docker compose --env-file /opt/smart-ai-painter/.env.prod -f /opt/smart-ai-painter/infra/docker-compose.prod.yml exec -T backend python -c "import supabase,storage3,postgrest; print(supabase.__version__, storage3.__version__, postgrest.__version__)"
```

## 5) Smoke Test API Endpoints

```bash
curl -sS -i https://smartpainter.me/health | head -n 20

curl -sS -i -X POST https://smartpainter.me/api/v1/generate/ \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","style":"realistic","strength":0.5,"sketch_base64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","page_preset":"landscape","page_width":1600,"page_height":900}' | head -n 40
```

For authenticated sketch save tests, use app UI or a valid bearer token.

## 6) If Anything Fails, Capture Logs Immediately

```bash
docker compose --env-file /opt/smart-ai-painter/.env.prod -f /opt/smart-ai-painter/infra/docker-compose.prod.yml logs --tail=200 backend
```

Also run the automated diagnostics workflow:

- `.github/workflows/prod-diagnostics.yml`

It prints env checks, container versions, active backend upload function source, and recent logs.
