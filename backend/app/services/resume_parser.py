import fitz  # PyMuPDF
import docx
import io

def extract_text_from_upload(file_bytes: bytes, filename: str) -> str:
    """
    Detects if the file is PDF or DOCX based on filename,
    and extracts all text from it.
    """
    text = ""
    filename_lower = filename.lower()
    
    if filename_lower.endswith(".pdf"):
        # Parse PDF
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
                
    elif filename_lower.endswith(".docx"):
        # Parse DOCX
        file_stream = io.BytesIO(file_bytes)
        doc = docx.Document(file_stream)
        for para in doc.paragraphs:
            text += para.text + "\n"
            
    else:
        raise ValueError("Unsupported file format. Only PDF and DOCX are supported.")
        
    return text.strip()
