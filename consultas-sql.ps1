# Script para ejecutar consultas SQL directamente contra MariaDB desde PowerShell

# Ruta al cliente MySQL de la instalación portable
$mysqlClient = "C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin\mysql.exe"

# Credenciales de conexión
$host = "localhost"
$user = "ai"
$password = "0260"
$database = "operator_insight"

# Función para ejecutar consultas SQL
function Ejecutar-Consulta {
    param (
        [string]$consulta,
        [string]$descripcion = "Consulta SQL"
    )
    
    Write-Host "`n$descripcion" -ForegroundColor Green
    Write-Host "SQL: $consulta" -ForegroundColor Yellow
    
    # Crear un archivo temporal para la consulta
    $tempFile = [System.IO.Path]::GetTempFileName()
    $consulta | Out-File -FilePath $tempFile -Encoding utf8
    
    # Ejecutar la consulta
    $resultado = & $mysqlClient -h $host -u $user -p$password $database -e "source $tempFile" --table
    
    # Mostrar el resultado
    $resultado
    
    # Eliminar el archivo temporal
    Remove-Item -Path $tempFile
}

# Menú de opciones
function Mostrar-Menu {
    Clear-Host
    Write-Host "=== Consultas SQL a MariaDB ===" -ForegroundColor Cyan
    Write-Host "1. Ver todos los registros de TLV1_Status"
    Write-Host "2. Insertar un nuevo registro"
    Write-Host "3. Actualizar un registro existente"
    Write-Host "4. Eliminar un registro"
    Write-Host "5. Consulta personalizada"
    Write-Host "6. Salir"
    Write-Host "Selecciona una opción (1-6): " -NoNewline -ForegroundColor Yellow
}

# Bucle principal
$opcion = 0
while ($opcion -ne 6) {
    Mostrar-Menu
    $opcion = Read-Host
    
    switch ($opcion) {
        1 {
            # Ver todos los registros
            Ejecutar-Consulta -consulta "SELECT * FROM TLV1_Status ORDER BY timestamp DESC;" -descripcion "Todos los registros de TLV1_Status"
            Read-Host "Presiona Enter para continuar"
        }
        2 {
            # Insertar un nuevo registro
            Write-Host "`nInsertar un nuevo registro" -ForegroundColor Green
            $modo = Read-Host "Modo (1=Automático, 2=Manual, 3=Mantenimiento, 4=Parado)"
            $ocupacion = Read-Host "Ocupación (0=Libre, 1=Ocupado)"
            $averia = Read-Host "Avería (0=Sin avería, 1=Avería leve, 2=Avería grave)"
            $matricula = Read-Host "Matrícula (código numérico)"
            $pasillo = Read-Host "Pasillo actual"
            $x = Read-Host "Posición X"
            $y = Read-Host "Posición Y"
            $z = Read-Host "Posición Z"
            
            $consulta = "INSERT INTO TLV1_Status (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual) VALUES ($modo, $ocupacion, $averia, $matricula, $pasillo, $x, $y, $z);"
            Ejecutar-Consulta -consulta $consulta -descripcion "Inserción de nuevo registro"
            Read-Host "Presiona Enter para continuar"
        }
        3 {
            # Actualizar un registro existente
            Write-Host "`nActualizar un registro existente" -ForegroundColor Green
            $id = Read-Host "ID del registro a actualizar"
            
            # Mostrar el registro actual
            Ejecutar-Consulta -consulta "SELECT * FROM TLV1_Status WHERE id = $id;" -descripcion "Registro actual"
            
            $campo = Read-Host "Campo a actualizar (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual)"
            $valor = Read-Host "Nuevo valor"
            
            $consulta = "UPDATE TLV1_Status SET $campo = $valor WHERE id = $id;"
            Ejecutar-Consulta -consulta $consulta -descripcion "Actualización de registro"
            
            # Mostrar el registro actualizado
            Ejecutar-Consulta -consulta "SELECT * FROM TLV1_Status WHERE id = $id;" -descripcion "Registro actualizado"
            Read-Host "Presiona Enter para continuar"
        }
        4 {
            # Eliminar un registro
            Write-Host "`nEliminar un registro" -ForegroundColor Green
            $id = Read-Host "ID del registro a eliminar"
            
            # Mostrar el registro a eliminar
            Ejecutar-Consulta -consulta "SELECT * FROM TLV1_Status WHERE id = $id;" -descripcion "Registro a eliminar"
            
            $confirmar = Read-Host "¿Estás seguro de que quieres eliminar este registro? (s/n)"
            if ($confirmar -eq "s") {
                $consulta = "DELETE FROM TLV1_Status WHERE id = $id;"
                Ejecutar-Consulta -consulta $consulta -descripcion "Eliminación de registro"
            } else {
                Write-Host "Operación cancelada" -ForegroundColor Yellow
            }
            Read-Host "Presiona Enter para continuar"
        }
        5 {
            # Consulta personalizada
            Write-Host "`nConsulta personalizada" -ForegroundColor Green
            Write-Host "Escribe tu consulta SQL (termina con punto y coma):" -ForegroundColor Yellow
            $consulta = Read-Host
            
            Ejecutar-Consulta -consulta $consulta -descripcion "Consulta personalizada"
            Read-Host "Presiona Enter para continuar"
        }
        6 {
            Write-Host "`nSaliendo..." -ForegroundColor Cyan
        }
        default {
            Write-Host "`nOpción no válida. Inténtalo de nuevo." -ForegroundColor Red
            Read-Host "Presiona Enter para continuar"
        }
    }
}
