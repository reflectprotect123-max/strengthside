from pathlib import Path
import sys
p=Path(__file__).resolve().parent/'validation-deps'
sys.path.insert(0,str(p))
import yaml,jsonschema
print('yaml',getattr(yaml,'__file__',None),hasattr(yaml,'safe_load'))
print('jsonschema',getattr(jsonschema,'__file__',None),hasattr(jsonschema,'Draft202012Validator'))
print(sys.path[:3])
