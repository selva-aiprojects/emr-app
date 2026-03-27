import re

file = r'd:\Training\working\EMR-Application\client\src\App.jsx'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

old = (
    "  useEffect(() => {\r\n"
    "    if (!tenant) return;\r\n"
    "    // Tenant theme colors are available as tenant.theme.primary / accent\r\n"
    "    // but we use the design-system palette instead\r\n"
    "  }, [tenant]);"
)

new = (
    "  useEffect(() => {\r\n"
    "    if (!tenant) return;\r\n"
    "    const theme = tenant.theme || {};\r\n"
    "    const primary = theme.primary || '#011627';\r\n"
    "    const accent = theme.accent || '#0077B6';\r\n"
    "    document.documentElement.style.setProperty('--clinical-primary', primary);\r\n"
    "    document.documentElement.style.setProperty('--clinical-secondary', accent);\r\n"
    "    document.documentElement.style.setProperty('--medical-navy', primary);\r\n"
    "    return () => {\r\n"
    "      document.documentElement.style.removeProperty('--clinical-primary');\r\n"
    "      document.documentElement.style.removeProperty('--clinical-secondary');\r\n"
    "      document.documentElement.style.removeProperty('--medical-navy');\r\n"
    "    };\r\n"
    "  }, [tenant]);"
)

if old in content:
    content = content.replace(old, new)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Tenant theme CSS variables applied.")
else:
    # Try with LF only
    old_lf = old.replace('\r\n', '\n')
    new_lf = new.replace('\r\n', '\n')
    if old_lf in content:
        content = content.replace(old_lf, new_lf)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS (LF): Tenant theme CSS variables applied.")
    else:
        print("NOT FOUND. Searching for key phrase...")
        idx = content.find("but we use the design-system palette instead")
        print(f"Design-system phrase index: {idx}")
        if idx > 0:
            print(repr(content[idx-200:idx+200]))
