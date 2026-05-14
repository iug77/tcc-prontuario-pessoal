$replacements = @{
    'OlÃ¡' = 'Olá'
    'estÃ¡' = 'está'
    'saÃºde' = 'saúde'
    'PermissÃµes' = 'Permissões'
    'NÃ£o foi possÃ­vel' = 'Não foi possível'
    'conexÃ£o' = 'conexão'
    'CabeÃ§alho' = 'Cabeçalho'
    'SÃ³' = 'Só'
    'Ã§' = 'ç'
    'Ã©' = 'é'
    'Ã¡' = 'á'
    'Ã³' = 'ó'
    'Ãº' = 'ú'
    'Ã£' = 'ã'
    'ðŸ'¬' = '💬'
    'ðŸ"‹' = '📋'
    'ðŸ"''' = '📝'
    'ðŸ"' = '📝'
    'ðŸ§¾' = '🧾'
    'ðŸ'«' = '📫'
}

Get-ChildItem "frontend/src/pages" -Filter "*.jsx" | ForEach-Object {
    Write-Host "Processando: $($_.Name)"
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    
    foreach ($key in $replacements.Keys) {
        $content = $content -replace $key, $replacements[$key]
    }
    
    Set-Content $_.FullName $content -Encoding UTF8
}

Write-Host "Conversão concluída!"
