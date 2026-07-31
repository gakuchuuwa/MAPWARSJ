import re
with open('src/data/TacticalSkillCatalog.ts', 'r', encoding='utf-8') as f:
    text = f.read()

names = set()
matches = re.finditer(r"displayName:\s*['\"]([^'\"]+)['\"]", text)
for m in matches:
    names.add(m.group(1).strip())

with open('existing_names.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sorted(list(names))))

print(f'Extracted {len(names)} unique names.')
