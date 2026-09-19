option explicit

!INC Local Scripts.EAConstants-VBScript

sub OnDiagramScript()
    dim currentPackage
    set currentPackage = Repository.GetTreeSelectedPackage()
    
    if currentPackage is nothing then
        Session.Prompt "Selecciona un paquete en el Project Browser", promptOK
        exit sub
    end if

    ' -------------------------------------------------------------
    ' 1. Crear el paquete contenedor "Implementación de Arquitectura"
    ' -------------------------------------------------------------
    dim contenedor
    set contenedor = crearPaquete(currentPackage, "Implementación de Arquitectura", "Diagrama de componentes - FashionStore")

    ' -------------------------------------------------------------
    ' 2. Definir los paquetes de componentes
    ' -------------------------------------------------------------
    dim paquetesNombres, paquetesDesc
    paquetesNombres = Array( _
        "Frontend Web", _
        "Frontend Móvil", _
        "Backend API", _
        "Servicios Externos", _
        "Base de Datos" _
    )
    paquetesDesc = Array( _
        "Aplicación web en Angular + TypeScript", _
        "Aplicación móvil en Flutter + Dart", _
        "API REST en FastAPI + Python", _
        "Pasarela de pago, IA y servicios externos", _
        "Persistencia de datos en PostgreSQL (Neon.Tech)" _
    )

    dim pkgWeb, pkgMovil, pkgBackend, pkgServicios, pkgDB
    dim paquetes()
    ReDim paquetes(UBound(paquetesNombres))

    dim i
    for i = 0 to UBound(paquetesNombres)
        set paquetes(i) = crearPaquete(contenedor, paquetesNombres(i), paquetesDesc(i))
    next

    set pkgWeb = paquetes(0)
    set pkgMovil = paquetes(1)
    set pkgBackend = paquetes(2)
    set pkgServicios = paquetes(3)
    set pkgDB = paquetes(4)

    ' -------------------------------------------------------------
    ' 3. Crear los componentes dentro de cada paquete
    ' -------------------------------------------------------------

    ' ---- Frontend Web ----
    crearComponente pkgWeb, "Angular App", "Aplicación web PWA en Angular 17"
    crearComponente pkgWeb, "Módulo de Autenticación", "Login, registro, gestión de perfil"
    crearComponente pkgWeb, "Módulo de Catálogo", "Visualización y filtros de productos"
    crearComponente pkgWeb, "Módulo de Reservas", "Gestión de reservas y preparación"
    crearComponente pkgWeb, "Módulo de Administración", "Panel de administración (Angular)"
    crearComponente pkgWeb, "Servicios API", "Consumo de endpoints REST (HttpClient)"

    ' ---- Frontend Móvil ----
    crearComponente pkgMovil, "Flutter App", "Aplicación móvil multiplataforma"
    crearComponente pkgMovil, "Módulo de Realidad Aumentada", "Vestidor virtual con ARKit/ARCore"
    crearComponente pkgMovil, "Módulo de Catálogo Móvil", "Catálogo adaptado a móvil"
    crearComponente pkgMovil, "Módulo de Reservas Móvil", "Reservas desde dispositivo móvil"
    crearComponente pkgMovil, "Módulo de Recomendaciones", "Recomendaciones por IA en móvil"

    ' ---- Backend API ----
    crearComponente pkgBackend, "FastAPI Gateway", "API Gateway principal"
    crearComponente pkgBackend, "Controlador de Usuarios", "Registro, login, perfiles"
    crearComponente pkgBackend, "Controlador de Catálogo", "CRUD de productos y categorías"
    crearComponente pkgBackend, "Controlador de Inventario", "Gestión de stock y disponibilidad"
    crearComponente pkgBackend, "Controlador de Reservas", "Creación, consulta, cancelación"
    crearComponente pkgBackend, "Controlador de Ventas", "Compras digitales y presenciales"
    crearComponente pkgBackend, "Controlador de Pagos", "Integración con Stripe"
    crearComponente pkgBackend, "Controlador de Reportes", "Generación de dashboards y reportes"
    crearComponente pkgBackend, "Servicio de Autenticación", "JWT y seguridad"
    crearComponente pkgBackend, "Servicio de Notificaciones", "Correos y push notifications"
    crearComponente pkgBackend, "ORM (SQLAlchemy)", "Mapeo objeto-relacional"

    ' ---- Servicios Externos ----
    crearComponente pkgServicios, "Stripe (Sandbox)", "Pasarela de pago para compras digitales"
    crearComponente pkgServicios, "Servicio de IA", "Recomendaciones con Surprise/scikit-learn"
    crearComponente pkgServicios, "Servicio de RA", "ARKit/ARCore para vestidor virtual"
    crearComponente pkgServicios, "Servicio de Email", "Envío de correos (SendGrid/SMTP)"
    crearComponente pkgServicios, "Servicio de Notificaciones Push", "Firebase Cloud Messaging"

    ' ---- Base de Datos (TODAS LAS TABLAS) ----
    crearTabla pkgDB, "usuarios", "Usuarios del sistema (clientes, empleados, administradores)"
    crearTabla pkgDB, "roles", "Roles y permisos del sistema"
    crearTabla pkgDB, "sucursales", "Sucursales de la cadena de tiendas"
    crearTabla pkgDB, "ciudades", "Ciudades donde se encuentran las sucursales"
    crearTabla pkgDB, "productos", "Catálogo de productos (prendas)"
    crearTabla pkgDB, "categorias", "Categorías de productos"
    crearTabla pkgDB, "tallas", "Tallas disponibles para prendas"
    crearTabla pkgDB, "colores", "Colores disponibles para prendas"
    crearTabla pkgDB, "temporadas", "Temporadas (Primavera-Verano, Otoño-Invierno)"
    crearTabla pkgDB, "colecciones", "Colecciones de productos"
    crearTabla pkgDB, "proveedores", "Proveedores de productos"
    crearTabla pkgDB, "producto_variantes", "Variantes de productos (talla, color, SKU)"
    crearTabla pkgDB, "inventario", "Stock por sucursal, producto y variante"
    crearTabla pkgDB, "movimientos_inventario", "Historial de movimientos de inventario"
    crearTabla pkgDB, "reservas", "Cabecera de reservas de prendas"
    crearTabla pkgDB, "reserva_items", "Detalle de reservas (prendas reservadas)"
    crearTabla pkgDB, "ventas", "Cabecera de ventas"
    crearTabla pkgDB, "venta_items", "Detalle de ventas"
    crearTabla pkgDB, "pagos", "Registro de pagos (digitales y presenciales)"
    crearTabla pkgDB, "bitacora", "Registro de eventos y auditoría"
    crearTabla pkgDB, "carrito", "Carrito de compras temporal"
    crearTabla pkgDB, "carrito_items", "Items del carrito de compras"
    
    ' Archivos SQL y scripts
    crearArchivo pkgDB, "fashionstore.sql", "Script de creación de base de datos"
    crearArchivo pkgDB, "migraciones.sql", "Migraciones para cambios de esquema"
    crearArchivo pkgDB, "procedimientos.sql", "Procedimientos almacenados"
    crearArchivo pkgDB, "triggers.sql", "Triggers para actualización automática"
    crearArchivo pkgDB, "consultas_reportes.sql", "Consultas para reportes y dashboards"
    
    ' Documentos de reportes
    crearArchivo pkgDB, "reportes.pdf", "Reportes y dashboards generados"
    crearArchivo pkgDB, "comprobantes.pdf", "Comprobantes de pago"
    crearArchivo pkgDB, "libreta.pdf", "Libreta de ventas"

    ' -------------------------------------------------------------
    ' 4. Crear el diagrama de componentes (tipo Component)
    ' -------------------------------------------------------------
    dim diagram
    set diagram = crearDiagramaLimpio(contenedor, "Implementación de Arquitectura - FashionStore", "Component")

    ' -------------------------------------------------------------
    ' 5. Posicionar los paquetes en el diagrama (vertical)
    '    NOTA: No se usa diagram.ShowSubItems para evitar errores
    ' -------------------------------------------------------------
    dim y, altura
    y = -50
    altura = 450

    colocarElemento diagram, pkgWeb, "50", "250", y, y - altura
    colocarElemento diagram, pkgMovil, "300", "500", y, y - altura
    colocarElemento diagram, pkgBackend, "550", "800", y, y - altura
    y = y - altura - 50
    colocarElemento diagram, pkgServicios, "50", "300", y, y - 350
    colocarElemento diagram, pkgDB, "350", "700", y, y - 450

    ' -------------------------------------------------------------
    ' 6. Crear las conexiones entre paquetes
    ' -------------------------------------------------------------
    crearAsociacion pkgWeb, pkgBackend, "HTTP/REST"
    crearAsociacion pkgMovil, pkgBackend, "HTTP/REST"
    crearAsociacion pkgBackend, pkgServicios, "API"
    crearAsociacion pkgBackend, pkgDB, "SQLAlchemy"

    ' -------------------------------------------------------------
    ' 7. Guardar, refrescar y abrir el diagrama
    ' -------------------------------------------------------------
    Repository.SaveDiagram diagram.DiagramID
    Repository.ReloadDiagram diagram.DiagramID
    Repository.OpenDiagram diagram.DiagramID

    Session.Prompt "Diagrama de implementación de arquitectura generado exitosamente. Todas las tablas están incluidas en el paquete Base de Datos.", promptOK
end sub

' -------------------------------------------------------------
' Funciones auxiliares
' -------------------------------------------------------------

function crearPaquete(package, name, descripcion)
    dim el
    for each el in package.Elements
        if el.Name = name and el.Type = "Package" then
            el.Notes = descripcion
            el.Update()
            set crearPaquete = el
            exit function
        end if
    next
    set el = package.Elements.AddNew(name, "Package")
    el.Notes = descripcion
    el.Update()
    package.Elements.Refresh()
    set crearPaquete = el
end function

function crearComponente(package, name, descripcion)
    dim el
    for each el in package.Elements
        if el.Name = name and el.Type = "Component" then
            el.Notes = descripcion
            el.Update()
            set crearComponente = el
            exit function
        end if
    next
    set el = package.Elements.AddNew(name, "Component")
    el.Notes = descripcion
    el.Update()
    package.Elements.Refresh()
    set crearComponente = el
end function

sub crearTabla(package, name, descripcion)
    dim el
    for each el in package.Elements
        if el.Name = name and el.Type = "Class" then
            el.Notes = descripcion
            el.Stereotype = "table"
            el.Update()
            exit sub
        end if
    next
    set el = package.Elements.AddNew(name, "Class")
    el.Notes = descripcion
    el.Stereotype = "table"
    el.Update()
    package.Elements.Refresh()
end sub

sub crearArchivo(package, name, descripcion)
    dim el
    for each el in package.Elements
        if el.Name = name and el.Type = "Artifact" then
            el.Notes = descripcion
            el.Update()
            exit sub
        end if
    next
    set el = package.Elements.AddNew(name, "Artifact")
    el.Notes = descripcion
    el.Update()
    package.Elements.Refresh()
end sub

function crearDiagramaLimpio(package, name, tipoDiagrama)
    dim diag, i
    for each diag in package.Diagrams
        if diag.Name = name then
            for i = diag.DiagramObjects.Count - 1 to 0 step -1
                diag.DiagramObjects.Delete i
            next
            for i = diag.DiagramLinks.Count - 1 to 0 step -1
                diag.DiagramLinks.Delete i
            next
            diag.DiagramObjects.Refresh()
            diag.DiagramLinks.Refresh()
            diag.Update()
            set crearDiagramaLimpio = diag
            exit function
        end if
    next
    set diag = package.Diagrams.AddNew(name, tipoDiagrama)
    diag.Update()
    package.Diagrams.Refresh()
    set crearDiagramaLimpio = diag
end function

sub colocarElemento(diagram, elemento, left, right, top, bottom)
    dim diagObj
    ' Usar ShowSubitems=1 para mostrar los elementos hijos dentro del paquete
    dim estilo
    estilo = "l=" & left & ";r=" & right & ";t=" & top & ";b=" & bottom & ";ShowSubitems=1;HideSubitems=0;"
    set diagObj = diagram.DiagramObjects.AddNew(estilo, "")
    diagObj.ElementID = elemento.ElementID
    diagObj.Update()
end sub

sub crearAsociacion(origen, destino, texto)
    dim con
    for each con in origen.Connectors
        if con.SupplierID = destino.ElementID and con.Type = "Association" then
            if con.Name = texto then exit sub
        end if
    next
    set con = origen.Connectors.AddNew("", "Association")
    con.SupplierID = destino.ElementID
    if texto <> "" then
        con.Name = texto
    end if
    con.Update()
end sub

OnDiagramScript