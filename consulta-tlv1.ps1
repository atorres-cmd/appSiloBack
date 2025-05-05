# Script para consultar el estado actual del TLV1 desde PowerShell

# URL de la API
$apiUrl = "http://localhost:3003/api/mariadb/tlv1"

# Realizar la petición GET
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    
    # Mostrar los datos en formato de tabla
    Write-Host "Estado actual del TLV1:" -ForegroundColor Green
    Write-Host "------------------------" -ForegroundColor Green
    
    # Crear una tabla personalizada para mostrar los datos
    $props = [ordered]@{
        "ID" = $response.id
        "Modo" = $response.modo
        "Ocupación" = $response.ocupacion
        "Avería" = $response.averia
        "Matrícula" = $response.matricula
        "Pasillo" = $response.pasillo_actual
        "Posición X" = $response.x_actual
        "Posición Y" = $response.y_actual
        "Posición Z" = $response.z_actual
        "Timestamp" = $response.timestamp
    }
    
    # Crear un objeto personalizado y mostrarlo como tabla
    $obj = New-Object -TypeName PSObject -Property $props
    $obj | Format-Table -AutoSize
    
} catch {
    Write-Host "Error al consultar la API: $_" -ForegroundColor Red
}

Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
