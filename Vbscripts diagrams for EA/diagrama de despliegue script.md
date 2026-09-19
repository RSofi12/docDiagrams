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
    ' 1. Crear el paquete contenedor "pkg Package"
    ' -------------------------------------------------------------
    dim contenedor
    set contenedor = crearPaqueteConEsterotipo(currentPackage, "Package", "pkg", "Diagrama de despliegue del sistema FashionStore")

    ' -------------------------------------------------------------
    ' 2. Crear los nodos individualmente
    ' -------------------------------------------------------------
    dim nodoCliente, nodoInternet, nodoFrontend, nodoBackend, nodoDB
    
    set nodoCliente = crearNodo(contenedor, "Cliente", "browser", Array("Navegador web / Angular", "Aplicación móvil / Flutter"))
    set nodoInternet = crearNodo(contenedor, "Internet", "device", Array("Proveedor de servicio", "Red pública"))
    set nodoFrontend = crearNodo(contenedor, "Frontend", "execution environment", Array("Angular + Node.js", "Docker container"))
    set nodoBackend = crearNodo(contenedor, "Backend", "execution environment", Array("FastAPI + Python", "Docker container"))
    set nodoDB = crearNodo(contenedor, "Base de Datos", "device", Array("PostgreSQL", "Neon.Tech (Cloud)"))

    ' -------------------------------------------------------------
    ' 3. Crear el diagrama de despliegue
    ' -------------------------------------------------------------
    dim diagram
    set diagram = crearDiagramaLimpio(contenedor, "Diagrama de Despliegue", "Deployment")

    ' -------------------------------------------------------------
    ' 4. Posicionar los nodos (columna vertical)
    ' -------------------------------------------------------------
    colocarElemento diagram, nodoCliente, "50", "250", "-50", "-200"
    colocarElemento diagram, nodoInternet, "50", "250", "-250", "-400"
    colocarElemento diagram, nodoFrontend, "50", "250", "-450", "-600"
    colocarElemento diagram, nodoBackend, "50", "250", "-650", "-800"
    colocarElemento diagram, nodoDB, "50", "250", "-850", "-1000"

    ' -------------------------------------------------------------
    ' 5. Crear las conexiones entre nodos
    ' -------------------------------------------------------------
    crearAsociacion nodoCliente, nodoInternet, "communication"
    crearAsociacion nodoInternet, nodoFrontend, "communication"
    crearAsociacion nodoFrontend, nodoBackend, "communication"
    crearAsociacion nodoBackend, nodoDB, "communication"

    ' -------------------------------------------------------------
    ' 6. Guardar, refrescar y abrir el diagrama
    ' -------------------------------------------------------------
    Repository.SaveDiagram diagram.DiagramID
    Repository.ReloadDiagram diagram.DiagramID
    Repository.OpenDiagram diagram.DiagramID

    Session.Prompt "Diagrama de despliegue para FashionStore generado exitosamente.", promptOK
end sub

' -------------------------------------------------------------
' Funciones auxiliares
' -------------------------------------------------------------

function crearPaqueteConEsterotipo(package, name, estereotipo, descripcion)
    dim el
    for each el in package.Elements
        if el.Name = name and el.Type = "Package" then
            el.Notes = descripcion
            if estereotipo <> "" then
                el.Stereotype = estereotipo
            end if
            el.Update()
            set crearPaqueteConEsterotipo = el
            exit function
        end if
    next
    set el = package.Elements.AddNew(name, "Package")
    el.Notes = descripcion
    if estereotipo <> "" then
        el.Stereotype = estereotipo
    end if
    el.Update()
    package.Elements.Refresh()
    set crearPaqueteConEsterotipo = el
end function

function crearNodo(package, name, estereotipo, atributos)
    dim el
    for each el in package.Elements
        if el.Name = name and el.Type = "Node" then
            if estereotipo <> "" then
                el.Stereotype = estereotipo
            end if
            ' Limpiar atributos existentes
            dim attr
            for each attr in el.Attributes
                el.Attributes.Delete attr.AttributeID
            next
            el.Attributes.Refresh()
            ' Agregar nuevos atributos
            dim a
            for each a in atributos
                agregarAtributo el, a
            next
            el.Update()
            set crearNodo = el
            exit function
        end if
    next
    set el = package.Elements.AddNew(name, "Node")
    if estereotipo <> "" then
        el.Stereotype = estereotipo
    end if
    el.Update()
    package.Elements.Refresh()
    dim at
    for each at in atributos
        agregarAtributo el, at
    next
    set crearNodo = el
end function

sub agregarAtributo(elemento, nombre)
    dim attr
    for each attr in elemento.Attributes
        if attr.Name = nombre then exit sub
    next
    set attr = elemento.Attributes.AddNew(nombre, "")
    attr.Update()
    elemento.Attributes.Refresh()
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
    set diagObj = diagram.DiagramObjects.AddNew("l=" & left & ";r=" & right & ";t=" & top & ";b=" & bottom & ";", "")
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