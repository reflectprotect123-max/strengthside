# Security and claims review

Review source, migrations, logs, tests, and product copy for:

- cross-account access and RLS;
- service-role or provider secrets in clients/logs;
- insecure local token/data storage;
- replay, stale writes, auth callbacks, deep links;
- exports, deletion, backups, and vendor/cross-border paths;
- health data in analytics or crash reports;
- diagnosis, prognosis, treatment, injury prediction, or medical-clearance claims;
- unsafe plugin/MCP/hook permissions.

Map each finding to a test or documented owner. Legal/clinical review remains a required external gate.
