from PyPDF2 import PdfReader, PdfWriter
import pdfplumber
import os

def process_files_in_folder(folder_path):
    for filename in os.listdir(folder_path):
        if filename.endswith(".pdf") or filename.endswith(".PDF"):
            file_path = os.path.join(folder_path, filename)
            get_info(file_path)

def get_info(path):
    with open(path, "rb") as f:
        pdf = PdfReader(f)
        number_of_pages = len(pdf.pages)
    print("pages: " + str(number_of_pages))
    with pdfplumber.open(path) as pdf:
        for i in range(number_of_pages):
            with pdfplumber.open(path) as pdf:
                page = pdf.pages[i]
                text = page.extract_text()
                for row in text.split(" \n\n"):
                    if row.startswith(""):
                        matricula = row.split()[-1]
                    fname = row.split()[-1]

                    pdf = PdfReader(path)
                    for page in range(i+1):
                        pdf_writer = PdfWriter()
                        pdf_writer.add_page(pdf.pages[page])

                        output_filename = "{}.pdf".format(fname)

                        with open(r"./arquivos/holerites/{}".format(output_filename), "wb") as out:
                            pdf_writer.write(out)
                            
                    print("PDF GERADO: {}".format(output_filename))

if __name__ == "__main__":
    folder_path = "./arquivos/holerites/"
    process_files_in_folder(folder_path)