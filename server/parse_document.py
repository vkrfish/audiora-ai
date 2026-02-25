import sys
import os
import io
from pdfminer.high_level import extract_text
try:
    from docx import Document
except ImportError:
    Document = None

def parse_pdf(file_path):
    try:
        text = extract_text(file_path)
        return text
    except Exception as e:
        return f"Error parsing PDF: {str(e)}"

def parse_docx(file_path):
    if not Document:
        return "Error: python-docx not installed"
    try:
        doc = Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        return f"Error parsing DOCX: {str(e)}"

def main():
    if len(sys.argv) < 2:
        print("Usage: python parse_document.py <file_path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == '.pdf':
            text = parse_pdf(file_path)
            if text.startswith("Error parsing PDF:"):
                print(text, file=sys.stderr)
                sys.exit(1)
            print(text)
        elif ext == '.docx':
            text = parse_docx(file_path)
            if text.startswith("Error:"):
                print(text, file=sys.stderr)
                sys.exit(1)
            print(text)
        elif ext == '.txt':
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    print(f.read())
            except UnicodeDecodeError:
                with open(file_path, 'r', encoding='latin-1') as f:
                    print(f.read())
        else:
            print(f"Error: Unsupported file extension: {ext}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
