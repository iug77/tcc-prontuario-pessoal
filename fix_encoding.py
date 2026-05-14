#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import glob

# Mapping of wrong byte sequences to correct unicode
replacements = [
    (b'\xc3\xa1', 'á'),  # Ã¡ -> á
    (b'\xc3\xa9', 'é'),  # Ã© -> é
    (b'\xc3\xb3', 'ó'),  # Ã³ -> ó
    (b'\xc3\xba', 'ú'),  # Ãº -> ú
    (b'\xc3\xa3', 'ã'),  # Ã£ -> ã
    (b'\xc3\xa7', 'ç'),  # Ã§ -> ç
]

# Additional single-char replacements
single_char_replacements = {
    'Ã©': 'é',
    'Ã¡': 'á', 
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã£': 'ã',
    'Ã§': 'ç',
}

jsx_files = glob.glob('frontend/src/pages/*.jsx')

for filepath in jsx_files:
    print(f"Processando: {filepath}")
    
    # Read file with latin-1 encoding (which seems to be the issue)
    with open(filepath, 'r', encoding='iso-8859-1') as f:
        content = f.read()
    
    # Apply replacements
    for wrong, correct in replacements.items():
        content = content.replace(wrong, correct)
    
    for wrong, correct in single_char_replacements.items():
        content = content.replace(wrong, correct)
    
    # Write back with UTF-8
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✓ Corrigido")

print("\nConversão concluída!")
