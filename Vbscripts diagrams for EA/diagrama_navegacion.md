' =====================================================================
' Script: Generar TODOS los Diagramas de Navegación - FashionStore
' Herramienta: Enterprise Architect 15
' Descripción: Crea el paquete "Navegacion_FashionStore" con un diagrama
'              por cada caso de uso del Ciclo #1 y Ciclo #2.
'              Solo usa estereotipos: actor, view, controller y table.
' =====================================================================

Option Explicit

' --- Constantes necesarias para EA ---
Const otPackage = 2

' --- Variables Globales ---
Dim Repository
Dim ThePackage

' --- Punto de entrada del script ---
Call Main()

' =====================================================================
' PROCEDIMIENTO PRINCIPAL
' =====================================================================
Sub Main()
    ' --- 1. OBTENER REPOSITORIO Y PAQUETE ACTUAL ---
    Set Repository = GetObject(, "EA.App").Repository
    Set ThePackage = Repository.GetTreeSelectedPackage()

    If ThePackage Is Nothing Then
        MsgBox "Por favor, selecciona un Paquete en el Navegador de Proyectos.", vbExclamation, "Paquete no seleccionado"
        Exit Sub
    End If

    ' --- 2. CREAR PAQUETE CONTENEDOR ---
    Dim NavPackage
    Set NavPackage = ThePackage.Packages.AddNew("Navegacion_FashionStore", "Package")
    NavPackage.Update()
    ThePackage.Packages.Refresh()

    ' =====================================================================
    ' CICLO #1 - 12 Casos de Uso
    ' =====================================================================
    '                  Paquete,        Diagrama,                    Actor,           Entidad,     Vista,                 Controlador,                 Acción,            Tabla
    Call CreateNavDiagram(NavPackage, "CU-01 Registrarse",           "Cliente",       "Usuario",   "registro_index",      "RegistroController",        "usuario_crear",   "tabla usuarios")
    Call CreateNavDiagram(NavPackage, "CU-02 Iniciar Sesion",        "Cliente",       "Usuario",   "login_index",         "LoginController",           "usuario_login",   "tabla usuarios")
    Call CreateNavDiagram(NavPackage, "CU-03 Gestionar Perfil",      "Cliente",       "Usuario",   "perfil_index",        "PerfilController",          "usuario_actualizar", "tabla usuarios")
    Call CreateNavDiagram(NavPackage, "CU-04 Consultar Catalogo",    "Cliente",       "Producto",  "catalogo_index",      "CatalogoController",        "producto_ver",    "tabla productos")
    Call CreateNavDiagram(NavPackage, "CU-05 Filtrar Productos",     "Cliente",       "Producto",  "filtros_index",       "FiltroController",          "producto_filtrar", "tabla productos")
    Call CreateNavDiagram(NavPackage, "CU-06 Consultar Disponibilidad", "Cliente",    "Inventario","disponibilidad_index","DisponibilidadController",  "inventario_consultar","tabla inventario")
    Call CreateNavDiagram(NavPackage, "CU-08 Realizar Reserva",      "Cliente",       "Reserva",   "reserva_index",       "ReservaController",         "reserva_crear",   "tabla reservas")
    Call CreateNavDiagram(NavPackage, "CU-09 Consultar Cancelar Reservas", "Cliente","Reserva",   "mis_reservas_index",  "ConsultaReservaController", "reserva_cancelar","tabla reservas")
    Call CreateNavDiagram(NavPackage, "CU-18 Preparar Reservas",     "Encargado",     "Reserva",   "preparar_reservas_index","PrepararReservaController","reserva_preparar","tabla reservas")
    Call CreateNavDiagram(NavPackage, "CU-19 Administrar Usuarios",  "Administrador", "Usuario",   "usuarios_index",      "UsuarioController",         "usuario_crear",   "tabla usuarios")
    Call CreateNavDiagram(NavPackage, "CU-20 Administrar Sucursales","Administrador", "Sucursal",  "sucursales_index",    "SucursalController",        "sucursal_crear",  "tabla sucursales")
    Call CreateNavDiagram(NavPackage, "CU-21 Administrar Catalogo",  "Administrador", "Producto",  "productos_index",     "ProductoController",        "producto_crear",  "tabla productos")

    ' =====================================================================
    ' CICLO #2 - 8 Casos de Uso
    ' =====================================================================
    Call CreateNavDiagram(NavPackage, "CU-10 Compra Digital",        "Cliente",       "Pedido",    "carrito_index",       "CompraController",          "pedido_crear",    "tabla pedidos")
    Call CreateNavDiagram(NavPackage, "CU-11 Compra Presencial",     "Cajero",        "Pedido",    "pos_index",           "VentaPresencialController", "pedido_crear",    "tabla pedidos")
    Call CreateNavDiagram(NavPackage, "CU-12 Gestionar Pagos",       "Cliente",       "Pago",      "pago_index",          "PagoController",            "pago_procesar",   "tabla pagos")
    Call CreateNavDiagram(NavPackage, "CU-13 Gestionar Inventario",  "Administrador", "Inventario","inventario_index",    "InventarioController",      "inventario_actualizar","tabla inventario")
    Call CreateNavDiagram(NavPackage, "CU-14 Administrar Proveedores","Administrador","Proveedor", "proveedores_index",   "ProveedorController",       "proveedor_crear", "tabla proveedores")
    Call CreateNavDiagram(NavPackage, "CU-15 Administrar Temporadas","Administrador", "Temporada", "temporadas_index",    "TemporadaController",       "temporada_crear", "tabla temporadas")
    Call CreateNavDiagram(NavPackage, "CU-22 Cerrar Sesion",         "Cliente",       "Usuario",   "logout_index",        "LogoutController",          "usuario_logout",  "tabla usuarios")
    Call CreateNavDiagram(NavPackage, "CU-23 Registrar Bitacora",    "Sistema",       "Bitacora",  "bitacora_index",      "BitacoraController",        "bitacora_registrar","tabla bitacoras")

    ' --- FINALIZAR ---
    Repository.RefreshModelView(0)
    MsgBox "¡Se crearon 20 Diagramas de Navegación en 'Navegacion_FashionStore'!" & vbCrLf & _
           "12 del Ciclo #1 y 8 del Ciclo #2.", vbInformation, "Proceso Completado"
End Sub

' =====================================================================
' FUNCIÓN PRINCIPAL PARA CREAR UN DIAGRAMA DE NAVEGACIÓN
' =====================================================================
Sub CreateNavDiagram(ParentPkg, DiagName, ActorName, EntityName, ViewName, ControllerName, ActionName, TableName)
    Dim TheDiagram
    Dim TheElement
    Dim TheConnector
    Dim TheAttribute
    Dim TheMethod
    Dim ElementID
    Dim ActorEl, EntityEl, ViewEl, ControllerEl, ActionEl, TableEl

    ' 1. Crear el Diagrama
    Set TheDiagram = ParentPkg.Diagrams.AddNew(DiagName, "Class")
    TheDiagram.Update()
    ParentPkg.Diagrams.Refresh()

    ' 2. Actor (reutilizar si ya existe)
    Set ActorEl = GetElementByName(ParentPkg, ActorName)
    If ActorEl Is Nothing Then
        Set TheElement = ParentPkg.Elements.AddNew(ActorName, "Actor")
        TheElement.Stereotype = "Actor"
        TheElement.Update()
        ParentPkg.Elements.Refresh()
        Set ActorEl = TheElement
    End If
    Call AddElementToDiagram(TheDiagram, ActorEl.ElementID, 50, 100, 150, 200)

    ' 3. Entity -> Estereotipo TABLE (reutilizar si ya existe)
    Set EntityEl = GetElementByName(ParentPkg, EntityName)
    If EntityEl Is Nothing Then
        Set TheElement = ParentPkg.Elements.AddNew(EntityName, "Class")
        TheElement.Stereotype = "table"
        Set TheAttribute = TheElement.Attributes.AddNew("id_" & LCase(EntityName), "int")
        TheAttribute.Visibility = "Private"
        TheAttribute.Update()
        Set TheAttribute = TheElement.Attributes.AddNew("email", "string")
        TheAttribute.Visibility = "Private"
        TheAttribute.Update()
        Set TheAttribute = TheElement.Attributes.AddNew("rol", "string")
        TheAttribute.Visibility = "Private"
        TheAttribute.Update()
        TheElement.Update()
        ParentPkg.Elements.Refresh()
        Set EntityEl = TheElement
    End If
    Call AddElementToDiagram(TheDiagram, EntityEl.ElementID, 200, 50, 350, 150)

    ' 4. View - Vista (reutilizar si ya existe)
    Set ViewEl = GetElementByName(ParentPkg, ViewName)
    If ViewEl Is Nothing Then
        Set TheElement = ParentPkg.Elements.AddNew(ViewName, "Class")
        TheElement.Stereotype = "view"
        Set TheAttribute = TheElement.Attributes.AddNew("search", "string")
        TheAttribute.Visibility = "Private"
        TheAttribute.Update()
        TheElement.Update()
        ParentPkg.Elements.Refresh()
        Set ViewEl = TheElement
    End If
    Call AddElementToDiagram(TheDiagram, ViewEl.ElementID, 200, 200, 350, 300)

    ' 5. Controller - Controlador (reutilizar si ya existe)
    Set ControllerEl = GetElementByName(ParentPkg, ControllerName)
    If ControllerEl Is Nothing Then
        Set TheElement = ParentPkg.Elements.AddNew(ControllerName, "Class")
        TheElement.Stereotype = "controller"
        Set TheMethod = TheElement.Methods.AddNew("menu", "void")
        TheMethod.Visibility = "Public"
        TheMethod.Update()
        Set TheMethod = TheElement.Methods.AddNew("submit", "void")
        TheMethod.Visibility = "Public"
        TheMethod.Update()
        TheElement.Update()
        ParentPkg.Elements.Refresh()
        Set ControllerEl = TheElement
    End If
    Call AddElementToDiagram(TheDiagram, ControllerEl.ElementID, 450, 100, 600, 200)

    ' 6. Action -> Estereotipo TABLE (reutilizar si ya existe)
    Set ActionEl = GetElementByName(ParentPkg, ActionName)
    If ActionEl Is Nothing Then
        Set TheElement = ParentPkg.Elements.AddNew(ActionName, "Class")
        TheElement.Stereotype = "table"
        Set TheMethod = TheElement.Methods.AddNew("guardar", "void")
        TheMethod.Visibility = "Public"
        TheMethod.Update()
        TheElement.Update()
        ParentPkg.Elements.Refresh()
        Set ActionEl = TheElement
    End If
    Call AddElementToDiagram(TheDiagram, ActionEl.ElementID, 450, 300, 600, 400)

    ' 7. Table - Tabla de BD (reutilizar si ya existe)
    Set TableEl = GetElementByName(ParentPkg, TableName)
    If TableEl Is Nothing Then
        Set TheElement = ParentPkg.Elements.AddNew(TableName, "Class")
        TheElement.Stereotype = "table"
        Set TheMethod = TheElement.Methods.AddNew("verDatos", "void")
        TheMethod.Visibility = "Public"
        TheMethod.Update()
        Set TheMethod = TheElement.Methods.AddNew("verEstado", "void")
        TheMethod.Visibility = "Public"
        TheMethod.Update()
        TheElement.Update()
        ParentPkg.Elements.Refresh()
        Set TableEl = TheElement
    End If
    Call AddElementToDiagram(TheDiagram, TableEl.ElementID, 700, 100, 850, 200)

    ' --- CONECTORES ---

    ' Actor -> Entity (Association)
    Set TheConnector = ActorEl.Connectors.AddNew("", "Association")
    TheConnector.SupplierID = EntityEl.ElementID
    TheConnector.Update()

    ' Entity -> View (BUILD)
    Set TheConnector = EntityEl.Connectors.AddNew("", "Dependency")
    TheConnector.SupplierID = ViewEl.ElementID
    TheConnector.Stereotype = "build"
    TheConnector.Update()

    ' View -> Controller (SUBMIT)
    Set TheConnector = ViewEl.Connectors.AddNew("", "Dependency")
    TheConnector.SupplierID = ControllerEl.ElementID
    TheConnector.Stereotype = "submit"
    TheConnector.Update()

    ' Controller -> Action (BUILD)
    Set TheConnector = ControllerEl.Connectors.AddNew("", "Dependency")
    TheConnector.SupplierID = ActionEl.ElementID
    TheConnector.Stereotype = "build"
    TheConnector.Update()

    ' Action -> Table (BUILD)
    Set TheConnector = ActionEl.Connectors.AddNew("", "Dependency")
    TheConnector.SupplierID = TableEl.ElementID
    TheConnector.Stereotype = "build"
    TheConnector.Update()

    ' Entity -> Table (BUILD)
    Set TheConnector = EntityEl.Connectors.AddNew("", "Dependency")
    TheConnector.SupplierID = TableEl.ElementID
    TheConnector.Stereotype = "build"
    TheConnector.Update()

    TheDiagram.Update()
    ParentPkg.Diagrams.Refresh()
End Sub

' =====================================================================
' FUNCIONES AUXILIARES
' =====================================================================

' --- Añadir un elemento al diagrama en una posición específica ---
Sub AddElementToDiagram(Diagram, TheElID, PosLeft, PosTop, PosRight, PosBottom)
    Dim DiagramObject
    Set DiagramObject = Diagram.DiagramObjects.AddNew("", "")
    DiagramObject.ElementID = TheElID
    DiagramObject.left = PosLeft
    DiagramObject.top = PosTop
    DiagramObject.right = PosRight
    DiagramObject.bottom = PosBottom
    DiagramObject.Update()
    Diagram.DiagramObjects.Refresh()
End Sub

' --- Obtener un elemento por su nombre en el paquete ---
Function GetElementByName(Pkg, ElementName)
    Dim Element
    For Each Element In Pkg.Elements
        If Element.Name = ElementName Then
            Set GetElementByName = Element
            Exit Function
        End If
    Next
    Set GetElementByName = Nothing
End Function