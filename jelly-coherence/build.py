"""Assemble index.html from src/. Run: python3 build.py"""
from pathlib import Path
here = Path(__file__).parent
src = here / "src"
html = ((src / "head.html").read_text() + "<script>\n{\n" + (src / "core.js").read_text()
        + "\n" + (src / "ui.js").read_text() + "\n}\n</script>\n</body></html>\n")
(here / "index.html").write_text(html)
print("wrote index.html")
