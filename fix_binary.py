#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import glob

# Get all JSX files
jsx_files = glob.glob('frontend/src/pages/*.jsx')

for filepath in jsx_files:
    print(f"Processando: {filepath}")
    
    try:
        # Read file as binary
        with open(filepath, 'rb') as f:
            content = f.read()
        
        # Replace patterns as bytes
        replacements = [
            # Arrows
            (b'\xc3\xa2\xe2\x86\x90', b'\xe2\x86\x90'),  # â† -> ←
            (b'\xc3\xa2\xe2\x86\x91', b'\xe2\x86\x91'),  # â‡ -> ↓
            # Bullet
            (b'\xc3\xa2\xe2\x82\xac\xc2\xa2', b'\xe2\x80\xa2'),  # â€¢ -> •
            # Emojis - remove the corruption characters
            (b'\xc3\xb0\xc5\x92\xe2\x80\x9d\xe2\x80\xb9', b'\xf0\x9f\x93\x8b'),  # ðŸ"‹ -> 📋
            (b'\xc3\xb0\xc5\x92\xe2\x80\x98\xc2\xac', b'\xf0\x9f\x92\xac'),  # ðŸ'¬ -> 💬
            (b'\xc3\xb0\xc5\x92\xe2\x80\x9d\xe2\x80\x99', b'\xf0\x9f\x93\x9d'),  # ðŸ"' -> 📝
            (b'\xc3\xb0\xc5\x92\xe2\x80\x9d', b'\xf0\x9f\x93\x9d'),  # ðŸ" -> 📝
            (b'\xc3\xb0\xc5\x92\xc2\xa7\xc2\xbe', b'\xf0\x9f\xa7\xbe'),  # ðŸ§¾ -> 🧾
            (b'\xc3\xb0\xc5\x92\xe2\x80\x93\xc2\xa8', b'\xf0\x9f\x96\xa8'),  # ðŸ–¨ -> 🖨
            # Portuguese mojibake (as byte sequences)
            (b'Ol\xc3\x83\xc2\xa1', 'Olá'.encode('utf-8')),
            (b'N\xc3\x83\xc2\xa3o', 'Não'.encode('utf-8')),
            (b'N\xc3\x83\xc2\xadvel', 'Nível'.encode('utf-8')),
            (b'A\xc3\x83\xc2\xa7\xc3\x83\xc2\xb5es', 'Ações'.encode('utf-8')),
            (b'Prontu\xc3\x83\xc2\xa1rio', 'Prontuário'.encode('utf-8')),
            (b'Informa\xc3\x83\xc2\xa7\xc3\x83\xc2\xa3o', 'Informação'.encode('utf-8')),
        ]
        
        for old_bytes, new_bytes in replacements:
            if old_bytes in content:
                content = content.replace(old_bytes, new_bytes)
        
        # Write back
        with open(filepath, 'wb') as f:
            f.write(content)
        
        print(f"  ✓ Corrigido")
    except Exception as e:
        print(f"  ! Erro: {e}")

print("\nConversão concluída!")
