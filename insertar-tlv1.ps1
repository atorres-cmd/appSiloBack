# Script para insertar nuevos datos en la tabla TLV1_Status desde PowerShell

# URL de la API
$apiUrl = "http://localhost:3003/api/mariadb/tlv1"

# Datos a insertar (puedes modificar estos valores según necesites)
$nuevosDatos = @{
    modo = 2                # 1=Automático, 2=Manual, 3=Mantenimiento, 4=Parado
    ocupacion = 1           # 0=Libre, 1=Ocupado
    averia = 0              # 0=Sin avería, 1=Avería leve, 2=Avería grave
    matricula = 1001        # Código numérico del transelevador
    pasillo_actual = 3      # Número de pasillo
    x_actual = 25           # Posición X
    y_actual = 12           # Posición Y
    z_actual = 5            # Posición Z
}

# Convertir los datos a formato JSON
$jsonBody = $nuevosDatos | ConvertTo-Json

# Realizar la petición POST
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $jsonBody -ContentType "application/json"
    
    Write-Host "Datos insertados correctamente:" -ForegroundColor Green
    $response | Format-List
    
    # Consultar los datos actualizados
    Write-Host "Consultando datos actualizados..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    
    $datosActualizados = Invoke-RestMethod -Uri $apiUrl -Method Get
    Write-Host "Datos actuales del TLV1:" -ForegroundColor Green
    $datosActualizados | Format-Table -AutoSize
    
} catch {
    Write-Host "Error al insertar datos en la API: $_" -ForegroundColor Red
}

Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
