import glob

html_files = glob.glob('c:/Users/leonp/recetas-ecuador/*.html')

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Colors
    content = content.replace("#0033A0", "#14213D")
    content = content.replace("bg-blue-800", "bg-[#0b1324]")
    content = content.replace("bg-blue-700", "bg-[#1f305c]")
    content = content.replace("border-blue-700", "border-[#14213D]")
    content = content.replace("#002280", "#0b1324")
    
    # Secondary highlight red
    content = content.replace("#EF3340", "#9A1B22")
    content = content.replace("bg-red-50", "bg-[#F9F1F2]")
    content = content.replace("border-red-200", "border-[#9A1B22]/20")
    content = content.replace("bg-red-100", "bg-[#F1DEE0]")
    
    # Gold
    content = content.replace("#FFD100", "#DCA011")

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Updated global utility classes in {len(html_files)} HTML files.")
