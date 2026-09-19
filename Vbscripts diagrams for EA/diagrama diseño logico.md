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
    ' 1. Crear el paquete contenedor principal "Diseño Lógico"
    ' -------------------------------------------------------------
    dim contenedor
    set contenedor = crearPaquete(currentPackage, "Diseño Lógico", "Diagrama de diseño lógico - FashionStore")

    ' -------------------------------------------------------------
    ' 2. Definir los módulos del sistema
    ' -------------------------------------------------------------
    dim modulos
    modulos = Array( _
        "Gestión de Usuarios", _
        "Catálogo", _
        "Inventario", _
        "Reservas", _
        "Ventas y Pagos", _
        "Inteligencia y Reportes" _
    )

    ' -------------------------------------------------------------
    ' 3. Crear los paquetes de Vista, Controlador y Modelo
    ' -------------------------------------------------------------
    dim i, modulo, vistaPkg, controladorPkg, modeloPkg
    dim vistaPkgs(), controladorPkgs(), modeloPkgs()
    ReDim vistaPkgs(UBound(modulos))
    ReDim controladorPkgs(UBound(modulos))
    ReDim modeloPkgs(UBound(modulos))

    for i = 0 to UBound(modulos)
        modulo = modulos(i)
        set vistaPkgs(i) = crearPaquete(contenedor, modulo & " Vista", "Interfaz de " & modulo)
        set controladorPkgs(i) = crearPaquete(contenedor, modulo & " Controller", "Controlador de " & modulo)
        set modeloPkgs(i) = crearPaquete(contenedor, modulo & " Modelo", "Modelo de datos de " & modulo)
    next

    ' -------------------------------------------------------------
    ' 4. Crear la base de datos (paquete especial)
    ' -------------------------------------------------------------
    dim dbPkg
    set dbPkg = crearPaquete(contenedor, "Base de Datos", "MySQL - Persistencia de datos")

    ' -------------------------------------------------------------
    ' 5. Crear el diagrama de paquetes (tipo Package)
    ' -------------------------------------------------------------
    dim diagram
    set diagram = crearDiagramaLimpio(contenedor, "Diseño Lógico - FashionStore", "Package")

    ' -------------------------------------------------------------
    ' 6. Posicionar los elementos en FILAS HORIZONTALES
    ' -------------------------------------------------------------
    ' Fila 1: Vista (todos los módulos) - top = -50
    ' Fila 2: Controlador (todos los módulos) - top = -250
    ' Fila 3: Modelo (todos los módulos) - top = -450
    ' Fila 4: Base de Datos (centrado) - top = -650
    
    dim x, ancho, alturaFila, numModulos
    numModulos = UBound(modulos) + 1
    ancho = 160
    alturaFila = 80
    
    ' Posicionar Vista (Fila 1)
    x = 30
    for i = 0 to UBound(modulos)
        colocarElemento diagram, vistaPkgs(i), x, x + ancho, "-50", "-" & (50 + alturaFila)
        x = x + ancho + 10
    next
    
    ' Posicionar Controlador (Fila 2)
    x = 30
    for i = 0 to UBound(modulos)
        colocarElemento diagram, controladorPkgs(i), x, x + ancho, "-250", "-" & (250 + alturaFila)
        x = x + ancho + 10
    next
    
    ' Posicionar Modelo (Fila 3)
    x = 30
    for i = 0 to UBound(modulos)
        colocarElemento diagram, modeloPkgs(i), x, x + ancho, "-450", "-" & (450 + alturaFila)
        x = x + ancho + 10
    next
    
    ' Posicionar Base de Datos (Fila 4, centrado)
    dim dbX, dbWidth
    dbWidth = 200
    dbX = (numModulos * (ancho + 10) - dbWidth) / 2
    colocarElemento diagram, dbPkg, dbX, dbX + dbWidth, "-650", "-" & (650 + 80)

    ' -------------------------------------------------------------
    ' 7. Crear las conexiones verticales entre capas
    ' -------------------------------------------------------------
    ' Vista -> Controlador (para cada módulo)
    for i = 0 to UBound(modulos)
        crearAsociacion vistaPkgs(i), controladorPkgs(i), "dependencia"
    next
    
    ' Controlador -> Modelo (para cada módulo)
    for i = 0 to UBound(modulos)
        crearAsociacion controladorPkgs(i), modeloPkgs(i), "dependencia"
    next
    
    ' Modelo -> Base de Datos (todos los modelos a la base de datos)
    for i = 0 to UBound(modulos)
        crearAsociacion modeloPkgs(i), dbPkg, "persistencia"
    next

    ' -------------------------------------------------------------
    ' 8. Guardar, refrescar y abrir el diagrama
    ' -------------------------------------------------------------
    Repository.SaveDiagram diagram.DiagramID
    Repository.ReloadDiagram diagram.DiagramID
    Repository.OpenDiagram diagram.DiagramID

    Session.Prompt "Diagrama de diseño lógico (filas horizontales) para FashionStore generado exitosamente.", promptOK
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
    dim estilo
    estilo = "l=" & left & ";r=" & right & ";t=" & top & ";b=" & bottom & ";"
    set diagObj = diagram.DiagramObjects.AddNew(estilo, "")
    diagObj.ElementID = elemento.ElementID
    diagObj.Update()
end sub

sub crearAsociacion(origen, destino, estereotipo)
    dim con
    for each con in origen.Connectors
        if con.SupplierID = destino.ElementID and con.Type = "Association" then
            if estereotipo = "" or con.Stereotype = estereotipo then
                exit sub
            end if
        end if
    next
    set con = origen.Connectors.AddNew("", "Association")
    con.SupplierID = destino.ElementID
    if estereotipo <> "" then
        con.Stereotype = estereotipo
    end if
    con.Update()
end sub

OnDiagramScript