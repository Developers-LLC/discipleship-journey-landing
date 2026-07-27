import re, os, subprocess

BOOKS = [
    {
        "src": "/home/ubuntu/upload/Book1_BELONG.md",
        "title": "BELONG",
        "subtitle": "Your First Steps Into the Family of God",
        "series": "The Discipleship Journey · Book 1 of 3",
        "track": "Beginner Track",
        "cover": "BELONG_KDP_Cover.jpg",
        "accent": "rgb(180, 100, 20)",
        "out": "/home/ubuntu/discipleship/books_pdf/BELONG.pdf",
    },
    {
        "src": "/home/ubuntu/upload/Book2_GROW.md",
        "title": "GROW",
        "subtitle": "Building Habits and Discovering Your S.H.A.P.E.",
        "series": "The Discipleship Journey · Book 2 of 3",
        "track": "Intermediate Track",
        "cover": "GROW_KDP_Cover.jpg",
        "accent": "rgb(30, 100, 60)",
        "out": "/home/ubuntu/discipleship/books_pdf/GROW.pdf",
    },
    {
        "src": "/home/ubuntu/upload/Book3_GO.md",
        "title": "GO",
        "subtitle": "Sharing Your Faith and Changing the World",
        "series": "The Discipleship Journey · Book 3 of 3",
        "track": "Advanced Track",
        "cover": "GO_KDP_Cover.jpg",
        "accent": "rgb(13, 31, 60)",
        "out": "/home/ubuntu/discipleship/books_pdf/GO.pdf",
    },
]

NAVY  = "rgb(13, 31, 60)"
GOLD  = "rgb(245, 158, 11)"
PARCH = "rgb(253, 248, 240)"
WHITE = "rgb(255, 255, 255)"


def preprocess(text):
    """Strip all non-body content from the markdown."""
    # Remove <details>...</details> blocks
    text = re.sub(r'<details[^>]*>.*?</details>', '', text, flags=re.DOTALL)
    # Remove all ```...``` fenced code blocks entirely
    text = re.sub(r'```[^\n]*\n.*?```', '', text, flags=re.DOTALL)
    # Remove LaTeX math blocks $$...$$
    text = re.sub(r'\$\$[^\$]*\$\$', '', text)
    # Remove inline math $...$
    text = re.sub(r'\$[^\$\n]+\$', '', text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove horizontal rules
    text = re.sub(r'^---+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\*\*\*+\s*$', '', text, flags=re.MULTILINE)
    # Remove KDP metadata headings (## 📋 KDP DASHBOARD... etc.)
    text = re.sub(r'^#{1,6}\s*.*?KDP.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^#{1,6}\s*.*?METADATA.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^#{1,6}\s*.*?PUBLISHING.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    # Remove blockquote metadata lines (> **Series**: ..., > **Level**: ..., etc.)
    # Match any blockquote line whose first bold word is a known metadata key
    text = re.sub(
        r'^>\s*\*\*(Series|Level|Focus|Bible Translation|Track|Genre|Target Audience|Price|ASIN|ISBN|Author|Publisher|Language|Pages|Word Count)[^\n]*$',
        '', text, flags=re.MULTILINE | re.IGNORECASE
    )
    # Also strip the entire opening metadata blockquote block (lines 1-10 that are all "> **Key**: value")
    text = re.sub(r'(^>\s*\*\*[A-Za-z ]+\*\*[^\n]*\n)+', '', text, flags=re.MULTILINE)
    # Decode HTML entities
    text = text.replace('&#39;', "'").replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&nbsp;', ' ')
    # Remove markdown anchor links [text](#anchor) → keep text only
    text = re.sub(r'\[([^\]]+)\]\(#[^\)]*\)', r'\1', text)
    # Remove full URL links [text](http...) → keep text only
    text = re.sub(r'\[([^\]]+)\]\(https?://[^\)]*\)', r'\1', text)
    # Remove bare URLs
    text = re.sub(r'https?://\S+', '', text)
    return text


def escape_plain(s):
    """Escape Typst special chars in a plain text string (no Typst markup)."""
    s = s.replace('\\', '\\\\')
    s = s.replace('@', '\\@')
    s = s.replace('<', '\\<').replace('>', '\\>')
    # Escape # only when not already escaped
    s = re.sub(r'(?<!\\)#', '\\#', s)
    s = s.replace('[', '\\[').replace(']', '\\]')
    return s


def inline_md(s):
    """Convert inline markdown to Typst inline markup, then escape remaining special chars."""
    # Bold-italic first
    s = re.sub(r'\*\*\*(.+?)\*\*\*', lambda m: f'#strong[#emph[{m.group(1)}]]', s)
    # Bold
    s = re.sub(r'\*\*(.+?)\*\*', lambda m: f'#strong[{m.group(1)}]', s)
    # Italic *...*
    s = re.sub(r'\*([^*\n]+?)\*', lambda m: f'#emph[{m.group(1)}]', s)
    # Italic _..._
    s = re.sub(r'_([^_\n]+?)_', lambda m: f'#emph[{m.group(1)}]', s)
    # Inline code
    s = re.sub(r'`([^`]+)`', lambda m: f'#raw("{m.group(1)}")', s)
    # Escape @ and < > outside Typst commands
    s = s.replace('@', '\\@')
    s = s.replace('<', '\\<').replace('>', '\\>')
    # Escape $ signs (Typst uses $ for math mode)
    s = s.replace('$', '\\$')
    # Escape # that are NOT part of a Typst command (#word or #()
    s = re.sub(r'(?<!\\)#(?![a-zA-Z(])', '\\#', s)
    # HTML entities
    s = s.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    return s


def md_to_typst_body(md_text, accent):
    lines = md_text.split('\n')
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # Empty line
        if line.strip() == '':
            out.append('')
            i += 1
            continue

        # H5 — deep subsection (##### ...)
        m = re.match(r'^#####\s+(.+)$', line)
        if m:
            title = escape_plain(re.sub(r'\*\*(.+?)\*\*', r'\1', m.group(1).strip()))
            out.append(f'\n#v(0.8em)\n#text(font: "Playfair Display", size: 11.5pt, weight: "bold", fill: {accent})[{title}]\n#v(0.2em)\n')
            i += 1
            continue

        # H4 — subsection (#### ...)
        m = re.match(r'^####\s+(.+)$', line)
        if m:
            title = escape_plain(re.sub(r'^\d+\.\s+', '', re.sub(r'\*\*(.+?)\*\*', r'\1', m.group(1).strip())))
            out.append(f'\n#v(1em)\n#text(font: "Playfair Display", size: 13pt, weight: "bold", fill: {accent})[{title}]\n#v(0.3em)\n')
            i += 1
            continue

        # H3 — chapter/section heading (### ...)
        m = re.match(r'^###\s+(.+)$', line)
        if m:
            title = escape_plain(re.sub(r'\*\*(.+?)\*\*', r'\1', m.group(1).strip()))
            if re.match(r'(CHAPTER|FOREWORD|APPENDIX|INTRODUCTION|CONCLUSION)', title, re.I):
                out.append(f"""
#pagebreak()
#v(2.5em)
#block(fill: {NAVY}, radius: 6pt, inset: (x: 24pt, y: 18pt), width: 100%)[
  #text(font: "Playfair Display", size: 24pt, weight: "bold", fill: {WHITE})[{title}]
]
#v(1.2em)
""")
            else:
                out.append(f'\n#v(1.5em)\n#text(font: "Playfair Display", size: 17pt, weight: "bold", fill: {NAVY})[{title}]\n#v(0.5em)\n')
            i += 1
            continue

        # H2 — major section (## ...)
        m = re.match(r'^##\s+(.+)$', line)
        if m:
            title = escape_plain(re.sub(r'\*\*(.+?)\*\*', r'\1', m.group(1).strip()))
            out.append(f'\n#v(1.5em)\n#text(font: "Playfair Display", size: 19pt, weight: "bold", fill: {NAVY})[{title}]\n#v(0.5em)\n')
            i += 1
            continue

        # H1 — skip (title already on cover)
        if re.match(r'^#\s+', line):
            i += 1
            continue

        # Blockquote — scripture / pull quote
        if line.startswith('> '):
            bq = []
            while i < len(lines) and lines[i].startswith('> '):
                bq.append(lines[i][2:])
                i += 1
            bq_text = ' '.join(bq).strip()
            bq_text = re.sub(r'\*\*(.+?)\*\*', r'\1', bq_text)
            bq_text = re.sub(r'\*(.+?)\*', r'\1', bq_text)
            bq_text = escape_plain(bq_text)
            out.append(f"""
#block(fill: {PARCH}, stroke: (left: 4pt + {GOLD}), radius: 4pt, inset: (x: 16pt, y: 12pt), width: 100%)[
  #text(font: "Playfair Display", style: "italic", size: 10.5pt, fill: {NAVY})[{bq_text}]
]
#v(0.6em)
""")
            continue

        # Bullet list
        if re.match(r'^\s*[-*]\s+', line):
            items = []
            while i < len(lines) and re.match(r'^\s*[-*]\s+', lines[i]):
                item = re.sub(r'^\s*[-*]\s+', '', lines[i])
                items.append(inline_md(item))
                i += 1
            items_typst = '\n'.join([f'  [{it}],' for it in items])
            out.append(f"""
#list(
  marker: text(fill: {GOLD})[✦],
{items_typst}
)
#v(0.3em)
""")
            continue

        # Numbered list
        if re.match(r'^\s*\d+\.\s+', line):
            items = []
            while i < len(lines) and re.match(r'^\s*\d+\.\s+', lines[i]):
                item = re.sub(r'^\s*\d+\.\s+', '', lines[i])
                items.append(inline_md(item))
                i += 1
            items_typst = '\n'.join([f'  [{it}],' for it in items])
            out.append(f"""
#enum(
  numbering: "1.",
{items_typst}
)
#v(0.3em)
""")
            continue

        # Normal paragraph
        para = inline_md(line)
        out.append(para + '\n')
        i += 1

    return '\n'.join(out)


def build_book(book):
    raw = open(book['src']).read()
    clean = preprocess(raw)
    body = md_to_typst_body(clean, book['accent'])

    typ = f"""
#set document(title: "{book['title']}: {book['subtitle']}", author: "Thomas Perdana")
#set page(
  paper: "us-letter",
  margin: (top: 1.2in, bottom: 1in, left: 1.1in, right: 1in),
  header: context {{
    if counter(page).get().first() > 2 {{
      set text(size: 8pt, fill: rgb(160, 160, 160))
      grid(columns: (1fr, 1fr),
        align(left)[The Discipleship Journey --- {book['title']}],
        align(right)[Thomas Perdana],
      )
      line(length: 100%, stroke: 0.5pt + rgb(220, 220, 220))
    }}
  }},
  footer: context {{
    if counter(page).get().first() > 2 {{
      set text(size: 8pt, fill: rgb(160, 160, 160))
      align(center)[#counter(page).display("1")]
    }}
  }},
)
#set text(font: ("Georgia", "Times New Roman"), size: 11pt, fill: rgb(40, 40, 50), hyphenate: true)
#set par(justify: true, leading: 0.75em, spacing: 1.1em)
#set heading(numbering: none)

// COVER
#page(margin: 0pt, background: rect(fill: {NAVY}, width: 100%, height: 100%))[
  #align(center + horizon)[
    #image("{book['cover']}", width: 58%)
    #v(1.8em)
    #text(font: "Playfair Display", size: 12pt, fill: {GOLD}, tracking: 3pt)[{book['series'].upper()}]
    #v(0.4em)
    #text(font: "Playfair Display", size: 10pt, fill: rgb(255,255,255,70%))[{book['track']}]
    #v(1.5em)
    #text(font: "Playfair Display", size: 10pt, fill: rgb(255,255,255,55%))[By Thomas Perdana]
  ]
]

// COPYRIGHT
#page[
  #v(1fr)
  #set text(size: 9pt, fill: rgb(120, 120, 130))
  #align(center)[
    *{book['title']}: {book['subtitle']}* \\
    Part of _The Discipleship Journey: From Welcome to Witness_ \\
    \\
    Copyright #sym.copyright 2024 Thomas Perdana. All rights reserved. \\
    Scripture quotations from the King James Version (KJV). \\
    Published by Cash in Blue LLC \\
    \\
    _Contact: thomas.perdana\\@cashinblue.com_ \\
    _Website: bible.thomasperdana.com_
  ]
  #v(1fr)
]

// BODY
{body}

// BACK MATTER
#pagebreak()
#v(3em)
#align(center)[
  #block(fill: {NAVY}, radius: 10pt, inset: (x: 30pt, y: 24pt), width: 78%)[
    #text(font: "Playfair Display", size: 15pt, weight: "bold", fill: {GOLD})[Continue the Journey]
    #v(0.8em)
    #set text(size: 10pt, fill: rgb(255,255,255,85%))
    The Discipleship Journey is a 3-book series taking you from your first steps in faith to becoming a confident witness for Christ.
    #v(0.8em)
    #text(fill: {GOLD})[bible.thomasperdana.com]
  ]
]
"""
    typ_path = book['out'].replace('.pdf', '.typ')
    with open(typ_path, 'w') as f:
        f.write(typ)
    print(f"Written: {typ_path}")
    result = subprocess.run(['typst', 'compile', typ_path, book['out']], capture_output=True, text=True)
    if result.returncode == 0:
        size = os.path.getsize(book['out'])
        print(f"✅ {book['title']}.pdf — {size/1024:.0f} KB")
    else:
        print(f"❌ {book['title']} FAILED")
        for ln in result.stderr.split('\n')[:40]:
            print(ln)


for book in BOOKS:
    build_book(book)
print("All done.")
