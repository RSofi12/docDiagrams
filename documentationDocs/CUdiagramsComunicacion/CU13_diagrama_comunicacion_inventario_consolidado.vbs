' ===============================================================================
' PROYECTO: FashionStore - E-Commerce
' CASO DE USO: CU13 - Consultar inventario consolidado
' DESCRIPCIÓN: Vista global de existencias de todas las sucursales.
' ACTOR: Administrador
' TIPO DE DIAGRAMA: Diagrama de Comunicación (UML 2.5+, íconos BCE con
'                   ShowRobustness=1; Boundary, Control, Entity).
' ENTORNO: Enterprise Architect 15.0.1514
' LENGUAJE: VBScript (motor nativo WSH en Enterprise Architect)
'
' NOTA DE CORRECCIÓN:
' - Los mensajes de comunicación SOLO se renderizan en diagramas de tipo
'   "Communication" (también Object/Analysis/Activity/StateMachine).
'   Por eso aquí se fuerza/verifica el tipo real del diagrama registrándolo
'   en la salida (ventana de scripts).
' - Participantes unidos con Association normal y mensajes agregados sobre la
'   Association mediante la colección Connector.Messages (equivale a "Add
'   Message from <origen> to <destino>" del menú contextual de EA).
' - Como respaldo visual, el nombre del conector también lleva el texto "n: fn()".
' ===============================================================================

Option Explicit

Const DEFAULT_PACKAGE_NAME = "CUdiagrams"
Const DIAGRAM_NAME = "CU13 - Consultar Inventario Consolidado (Comunicacion) - VBS"

Dim msgCounter
msgCounter = 0

Sub Logt(msg)
    Session.Output "[CU13-Comunicacion-VBS] " & msg
End Sub

' -----------------------------------------------------------------------------
' Paquete de destino en el Project Browser
' -----------------------------------------------------------------------------
Function GetTargetPackage()
    Dim selectedPkg, roots, root, p, newPkg, i
    Set GetTargetPackage = Nothing

    Set selectedPkg = Repository.GetTreeSelectedPackage()
    If Not selectedPkg Is Nothing Then
        Logt "Usando paquete seleccionado en Project Browser: " & selectedPkg.Name
        Set GetTargetPackage = selectedPkg
        Exit Function
    End If

    Set roots = Repository.Models
    If roots.Count > 0 Then Set root = roots.GetAt(0) Else Set root = Nothing End If
    If root Is Nothing Then
        Session.Prompt "No se encontró ningún modelo raíz en Enterprise Architect.", 0
        Exit Function
    End If

    For i = 0 To root.Packages.Count - 1
        Set p = root.Packages.GetAt(i)
        If p.Name = DEFAULT_PACKAGE_NAME Then
            Set GetTargetPackage = p
            Exit Function
        End If
    Next

    Set newPkg = root.Packages.AddNew(DEFAULT_PACKAGE_NAME, "Package")
    newPkg.Update()
    root.Packages.Refresh()
    Logt "Paquete creado: " & DEFAULT_PACKAGE_NAME
    Set GetTargetPackage = newPkg
End Function

' -----------------------------------------------------------------------------
' Recrea el diagrama limpio. Solo se aceptan los tipos donde EA dibuja mensajes
' de comunicación (Communication / Object / Analysis / Activity / StateMachine).
' -----------------------------------------------------------------------------
Function RecreateDiagram(parentPkg)
    Dim i, d, types, j, diagram
    Set RecreateDiagram = Nothing

    For i = parentPkg.Diagrams.Count - 1 To 0 Step -1
        Set d = parentPkg.Diagrams.GetAt(i)
        If d.Name = DIAGRAM_NAME Then
            On Error Resume Next
            parentPkg.Diagrams.Delete i
            parentPkg.Diagrams.Refresh()
            If Err.Number = 0 Then Logt "Diagrama previo eliminado." Else Logt "Aviso al eliminar: " & Err.Description
            On Error GoTo 0
            Exit For
        End If
    Next

    types = Array("Communication", "Object", "Analysis", "StateMachine", "Activity")
    For j = 0 To UBound(types)
        Set diagram = Nothing
        On Error Resume Next
        Set diagram = parentPkg.Diagrams.AddNew(DIAGRAM_NAME, types(j))
        If Err.Number = 0 Then
            diagram.Update()
            On Error GoTo 0
            Logt "Tipo de diagrama creado: '" & diagram.Type & "'"
            If LCase(diagram.Type) = LCase(types(j)) Then
                diagram.StyleEx = "ShowRobustness=1;"
                diagram.Update()
                parentPkg.Diagrams.Refresh()
                Set RecreateDiagram = diagram
                Exit Function
            End If
        Else
            On Error GoTo 0
        End If
    Next

    If RecreateDiagram Is Nothing Then
        Logt "ERROR: no se pudo crear un tipo de diagrama compatible con mensajes de comunicación."
    End If
End Function

' -----------------------------------------------------------------------------
' Agrega un participante (Actor / Class con estereotipo BCE)
' -----------------------------------------------------------------------------
Function AddCommElement(parentPkg, diagram, name, typeName, stereotype, l, r, t, b)
    Dim el, dObj
    Set el = parentPkg.Elements.AddNew(name, typeName)
    If Len(stereotype) > 0 Then el.Stereotype = stereotype
    el.Update()

    Set dObj = diagram.DiagramObjects.AddNew("l=" & l & ";r=" & r & ";t=" & t & ";b=" & b & ";", "")
    dObj.ElementID = el.ElementID
    dObj.Update()
    Set AddCommElement = el
End Function

' -----------------------------------------------------------------------------
' Busca el enlace (Association) entre a y b en cualquier dirección
' -----------------------------------------------------------------------------
Function FindLink(a, b)
    Dim i, c
    Set FindLink = Nothing
    For i = 0 To a.Connectors.Count - 1
        Set c = a.Connectors.GetAt(i)
        If (c.SupplierID = b.ElementID And c.ClientID = a.ElementID) Or _
           (c.SupplierID = a.ElementID And c.ClientID = b.ElementID) Then
            Set FindLink = c
            Exit Function
        End If
    Next
End Function

' -----------------------------------------------------------------------------
' Agrega mensaje sobre la Association (equivale a "Add Message from X to Y")
' -----------------------------------------------------------------------------
Sub AddCommMessage(srcEl, dstEl, seqNo, fnName)
    Dim con, msg
    Set con = FindLink(srcEl, dstEl)
    If con Is Nothing Then
        Set con = srcEl.Connectors.AddNew("", "Association")
        con.SupplierID = dstEl.ElementID
        con.Update()
    End If

    ' Respaldo visual: nombre del conector con el texto completo del mensaje
    con.Name = seqNo & ": " & fnName
    con.Update()

    ' Mensaje de comunicación real (t_message sobre la asociación)
    On Error Resume Next
    Set msg = con.Messages.AddNew(fnName, "")
    msg.Name = fnName
    msg.SequenceNo = seqNo
    msgCounter = msgCounter + 1
    msg.SequenceID = msgCounter
    msg.Update()
    con.Messages.Refresh()
    If Err.Number <> 0 Then
        Logt "Aviso al agregar mensaje (" & seqNo & ": " & fnName & "): " & Err.Description
    End If
    On Error GoTo 0
End Sub

' =============================================================================
' MAIN
' =============================================================================
Dim pkg, diagram
Dim actorAdmin, uiInventario, ctrlInventario
Dim entInventario, entVariante, entProducto, entSucursal, entTalla, entColor

Logt "Iniciando generación del Diagrama de Comunicación CU13 (VBScript)..."
Set pkg = GetTargetPackage()
If pkg Is Nothing Then
    WScript.Quit 1
End If

Set diagram = RecreateDiagram(pkg)
If diagram Is Nothing Then
    Session.Prompt "No se pudo crear el diagrama de comunicación. Revisa la salida de scripts.", 0
    WScript.Quit 1
End If

' -----------------------------------------------------------------------------
' 1. PARTICIPANTES (name only, sin estereotipo textual): Actor->Boundary->Control->Entities
' -----------------------------------------------------------------------------
Set actorAdmin      = AddCommElement(pkg, diagram, "Administrador", "Actor", "", 40, 120, 170, 220)
Set uiInventario    = AddCommElement(pkg, diagram, ":AdminInventoryPageComponent", "Class", "boundary", 260, 420, 140, 190)
Set ctrlInventario  = AddCommElement(pkg, diagram, ":InventoryController", "Class", "control", 600, 760, 140, 190)
Set entInventario   = AddCommElement(pkg, diagram, ":Inventario", "Class", "entity", 940, 1050, 110, 160)
Set entVariante     = AddCommElement(pkg, diagram, ":Variante", "Class", "entity", 1100, 1210, 110, 160)
Set entProducto     = AddCommElement(pkg, diagram, ":Producto", "Class", "entity", 1260, 1370, 110, 160)
Set entSucursal     = AddCommElement(pkg, diagram, ":Sucursal", "Class", "entity", 1420, 1530, 110, 160)
Set entTalla        = AddCommElement(pkg, diagram, ":Talla", "Class", "entity", 1580, 1690, 110, 160)
Set entColor        = AddCommElement(pkg, diagram, ":Color", "Class", "entity", 1740, 1850, 110, 160)

' -----------------------------------------------------------------------------
' 2. MENSAJES NUMERADOS (funciones reales, sin parámetros)
' -----------------------------------------------------------------------------
AddCommMessage actorAdmin,     uiInventario,  "1", "consultarInventarioConsolidado()"
AddCommMessage uiInventario,   ctrlInventario, "1.1", "getConsolidatedStock()"
AddCommMessage ctrlInventario, entInventario, "1.2", "obtenerExistenciasPorSucursal()"
AddCommMessage ctrlInventario, entVariante,   "1.3", "obtenerDetalleVariantes()"
AddCommMessage ctrlInventario, entProducto,   "1.4", "obtenerDatosProductos()"
AddCommMessage ctrlInventario, entSucursal,   "1.5", "obtenerSucursales()"
AddCommMessage ctrlInventario, entTalla,      "1.6", "obtenerTallas()"
AddCommMessage ctrlInventario, entColor,      "1.7", "obtenerColores()"
AddCommMessage ctrlInventario, uiInventario,  "1.8", "mostrarInventarioConsolidado()"
AddCommMessage uiInventario,   actorAdmin,    "1.9", "renderizarInventarioConsolidado()"

' -----------------------------------------------------------------------------
' Guardar y abrir
' -----------------------------------------------------------------------------
diagram.Update()
Repository.SaveDiagram diagram.DiagramID
Repository.ReloadDiagram diagram.DiagramID
Repository.OpenDiagram diagram.DiagramID
Logt "Diagrama '" & DIAGRAM_NAME & "' generado y abierto correctamente."
Session.Prompt "¡Diagrama de Comunicación CU13 (VBS) generado con éxito!", 0