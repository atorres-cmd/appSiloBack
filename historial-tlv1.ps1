# Script para consultar el historial de estados del TLV1 desde PowerShell

# URL de la API (con límite de 10 registros)
$apiUrl = "http://localhost:3003/api/mariadb/tlv1/historial?limit=10"

# Realizar la petición GET
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    
    # Mostrar los datos en formato de tabla
    Write-Host "Historial de estados del TLV1:" -ForegroundColor Green
    Write-Host "------------------------------" -ForegroundColor Green
    
    # Mostrar los datos como tabla
    $response | Format-Table -Property id, modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, timestamp -AutoSize
    
    # Mostrar estadísticas básicas
    Write-Host "Estadísticas:" -ForegroundColor Cyan
    Write-Host "Total de registros: $($response.Count)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error al consultar la API: $_" -ForegroundColor Red
}

Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
