# format_key.py
import os
from dotenv import load_dotenv

load_dotenv()

private_key = os.environ.get('FIREBASE_PRIVATE_KEY')
if private_key:
    # Substitui quebras de linha reais por \n
    formatted_key = private_key.replace('\n', '\\n')
    print(f"FIREBASE_PRIVATE_KEY: \"{formatted_key}\"")
else:
    print("Chave não encontrada no arquivo .env")