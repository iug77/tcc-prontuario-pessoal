#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import glob

# Get all JSX files
jsx_files = glob.glob('frontend/src/pages/*.jsx')

for filepath in jsx_files:
    print(f"Processando: {filepath}")
    
    try:
        # Read file
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        # Replace ALL mojibake patterns
        replacements = [
            # Arrow emojis
            ('â†', '←'),
            ('â‡', '↓'),
            ('â†"', '↔'),
            # Bullet points and special chars
            ('â€¢', '•'),
            ('â€™', "'"),
            ('â€œ', '"'),
            # Emoji corruption
            ('ðŸ"‹', '📋'),
            ('ðŸ'¬', '💬'),
            ('ðŸ"'', '📝'),
            ('ðŸ"', '📝'),
            ('ðŸ§¾', '🧾'),
            ('ðŸ–¨', '🖨'),
            ('ðŸ'«', '📫'),
            # Portuguese characters (multiple patterns)
            ('OlÃ¡', 'Olá'),
            ('NÃ£o', 'Não'),
            ('NÃ­vel', 'Nível'),
            ('AÃ§Ãµes', 'Ações'),
            ('ProntuÃ¡rio', 'Prontuário'),
            ('InformaÃ§Ã£o', 'Informação'),
            # Direct mojibake fixes
            ('Ã£o foi possÃvel', 'Não foi possível'),
            ('Ã¡o foi possÃvel', 'Não foi possível'),
            ('Erro de conexÃ£o', 'Erro de conexão'),
            ('saÃºde', 'saúde'),
            ('PermissÃ£o', 'Permissão'),
            ('PermissÃµes', 'Permissões'),
            ('CabeÃ§alho', 'Cabeçalho'),
            ('VisualizaÃ§Ã£o', 'Visualização'),
            ('GestÃ£o', 'Gestão'),
            ('Ã"rgÃ£o', 'Órgão'),
            ('aÃ§Ã£o', 'ação'),
            ('AÃ§Ã£o', 'Ação'),
            ('ExpiraÃ§Ã£o', 'Expiração'),
            ('DigitaÃ§Ã£o', 'Digitação'),
            ('RecomendaÃ§Ãµes', 'Recomendações'),
            ('ConclusÃ£o', 'Conclusão'),
            ('ExtraÃ§Ã£o', 'Extração'),
            ('FunÃ§Ã£o', 'Função'),
            ('informaÃ§Ã£o', 'informação'),
            ('realizaÃ§Ã£o', 'realização'),
            ('HistÃ³rico', 'Histórico'),
            ('clÃnica', 'clínica'),
            ('mÃ©dico', 'médico'),
            ('prontuÃ¡rio', 'prontuário'),
            ('usuÃ¡rio', 'usuário'),
            ('tendÃªncias', 'tendências'),
            ('pendÃªncias', 'pendências'),
            ('ruÃdo', 'ruído'),
            # Clean up any remaining single mojibake chars
            ('Ã£', 'ã'),
            ('Ã§', 'ç'),
            ('Ã¡', 'á'),
            ('Ã©', 'é'),
            ('Ã³', 'ó'),
            ('Ãº', 'ú'),
            ('Ã­', 'í'),
            ('Ã', 'Á'),
            ('ðŸ', ''),
            ('â€', ''),
            ('â†', '←'),
        ]
        
        for old, new in replacements:
            if old in content:
                content = content.replace(old, new)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ Corrigido")
    except Exception as e:
        print(f"  ! Erro: {e}")

print("\nConversão concluída!")



