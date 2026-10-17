# Netlify retirement

This repository no longer builds or deploys athlete or Coach surfaces through
Netlify. The athlete UI ships in the Android APK; the Coach desktop installer
bundles `apps/coach/` locally. Athlete and Coach WHOOP requests call Supabase
Edge Functions directly. Coach text uses the new authenticated
`supabase/functions/brain-coach/` Edge Function.

The four Netlify GitHub Actions workflows, deploy scripts, site configs, local
function proxies, and the old Brain-owner Netlify function bundle have been
removed. The old Coach portal now calls the shared Supabase WHOOP endpoints.

## Coach backend setup

The Edge Function code is local but requires a one-time configured Supabase
secret before the Coach feature can answer requests:

- GitHub Actions secret `SUPABASE_ACCESS_TOKEN`
- GitHub Actions secret `OPENROUTER_API_KEY`
- Optional GitHub Actions variable `OPENROUTER_MODEL` (defaults to
  `openrouter/free`)

Then run **Actions → Deploy Supabase brain coach → Run workflow**. The job writes
the provider key to Supabase function secrets and deploys only `brain-coach`.
The function verifies the user JWT through Supabase Auth, then forwards bounded
conversation history to OpenRouter. It never exposes the provider key to the
browser. Do not store the key in repository files.

## External cleanup still required

The merge workflow did not deploy to Netlify: the deploy step reported that
`NETLIFY_AUTH_TOKEN` was not configured and skipped. Removing repository code
does not delete sites or GitHub secrets already stored outside this checkout.
The GitHub Actions API returned 403 when listing repository secrets, so I could
not verify or remove them. If the Netlify projects still exist in your account,
delete the retired `thehybridsystem` and `thehybridengine1` sites in the Netlify
dashboard and remove `NETLIFY_AUTH_TOKEN`, `BRAIN_OWNER_NETLIFY_SITE_ID`, and
`HYBRID1_NETLIFY_SITE_ID` from GitHub Actions secrets.

The Android APK GitHub workflow builds an artifact on pushes to `main`. It does
not publish a Capgo update; Capgo remains a separate explicit release action.
