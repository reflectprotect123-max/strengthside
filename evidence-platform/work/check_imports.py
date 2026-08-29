"""Smoke-check that a real (interpreter-matched, pip-installed) jsonschema
and pyyaml are importable. See validators/validate_platform.py for why this
no longer shadows in a vendored copy: it was a win_amd64 build with a native
extension that cannot load on Linux, silently downgrading schema
meta-validation to a warning on every platform this project actually runs
on. `pip install jsonschema pyyaml` before running this.
"""
import yaml, jsonschema
print('yaml', getattr(yaml, '__file__', None), hasattr(yaml, 'safe_load'))
print('jsonschema', getattr(jsonschema, '__file__', None), hasattr(jsonschema, 'Draft202012Validator'))
