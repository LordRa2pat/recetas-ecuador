import os
import glob
import re

html_files = glob.glob('c:/Users/leonp/recetas-ecuador/*.html')

new_font_link = '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&display=swap" rel="stylesheet" />'

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update font link
    content = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?family=Inter[^"]+" rel="stylesheet" />', new_font_link, content)
    
    # 2. Update colors
    content = content.replace("'#FFD100'", "'#DCA011'")
    content = content.replace("'#0033A0'", "'#14213D'")
    content = content.replace("'#EF3340'", "'#9A1B22'")
    content = content.replace("'#006400'", "'#284B34'")

    # 3. Add serif and sans to font family in tailwind config if not exists
    if "fontFamily:" not in content and "tailwind.config" in content:
        content = content.replace("colors: {", "fontFamily: { sans: ['\"DM Sans\"', 'system-ui', 'sans-serif'], serif: ['\"Playfair Display\"', 'Georgia', 'serif'] }, colors: {")
    elif "fontFamily:" in content:
        content = content.replace("fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }", "fontFamily: { sans: ['\"DM Sans\"', 'system-ui', 'sans-serif'], serif: ['\"Playfair Display\"', 'Georgia', 'serif'] }")

    # Global background colors update from bg-slate-50 to an editorial warm tone
    content = content.replace("bg-slate-50", "bg-[#FDFBF7]")

    # Font classes across HTML updates
    # Change heavy font-black to elegant font-bold + font-serif on key headers
    # We can't do this with a blanket regex, but we can do some easy ones
    content = content.replace("font-black text-gray-900", "font-bold font-serif text-[#14213D]")
    content = content.replace("font-black text-white", "font-bold font-serif text-[#FDFBF7]")

    # rounded-3xl -> rounded-xl to be less "mobile app" and more editorial
    content = content.replace("rounded-3xl", "rounded-2xl") 

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Updated {len(html_files)} files.")
