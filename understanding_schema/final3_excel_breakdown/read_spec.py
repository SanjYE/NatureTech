import sys
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    from docx import Document
except ImportError:
    print("python-docx not found, installing...")
    install("python-docx")
    from docx import Document

def read_docx(file_path):
    doc = Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

if __name__ == "__main__":
    file_path = "TERRAGRN_Decision_Engine_Spec_v2.2_Unified.docx"
    try:
        content = read_docx(file_path)
        print(content)
    except Exception as e:
        print(f"Error reading file: {e}")
