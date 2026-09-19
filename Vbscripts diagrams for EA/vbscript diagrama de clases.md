option explicit

!INC Local Scripts.EAConstants-VBScript

' -------------------------------------------------------------
' Datos de los casos de uso del Ciclo #1
' Cada entrada: nombreActor, arrayMetodosActor, arrayClases
' Cada clase: nombreClase, arrayAtributos, arrayMetodos
' -------------------------------------------------------------

sub OnDiagramScript()
    dim currentPackage
    set currentPackage = Repository.GetTreeSelectedPackage()
    
    if currentPackage is nothing then
        Session.Prompt "Selecciona un paquete en el Project Browser", promptOK
        exit sub
    end if

    ' Definir todos los casos de uso del ciclo #1
    dim casosUso
    casosUso = Array( _
        getCU01(), _
        getCU02(), _
        getCU03(), _
        getCU04(), _
        getCU05(), _
        getCU06(), _
        getCU08(), _
        getCU09(), _
        getCU18(), _
        getCU19(), _
        getCU20(), _
        getCU21() _
    )

    dim i, cu, nombreActor, metodosActor, clases, nombreDiagrama
    for i = 0 to UBound(casosUso)
        cu = casosUso(i)
        nombreActor = cu(0)
        metodosActor = cu(1)
        clases = cu(2)
        nombreDiagrama = "Análisis " & cu(3)  ' El nombre del caso de uso viene en la posición 3

        crearDiagramaCasoUso currentPackage, nombreActor, metodosActor, clases, nombreDiagrama
    next

    Session.Prompt "Se generaron " & UBound(casosUso) + 1 & " diagramas de análisis de clases para el Ciclo #1.", promptOK
end sub

' -------------------------------------------------------------
' Funciones para cada caso de uso (retornan arrays)
' -------------------------------------------------------------

function getCU01()
    ' CU-01 Registrarse en la plataforma
    dim metodosActor, clases
    metodosActor = Array("+ mostrarFormulario(): void", "+ enviarDatos(): void", "+ mostrarConfirmacion(): void")
    
    clases = Array( _
        Array( _
            "CU-01 Registrarse: UI_Registro", _
            Array("- formulario: Form"), _
            Array("+ mostrarFormulario(): void", "+ enviarDatos(): void", "+ mostrarConfirmacion(): void") _
        ), _
        Array( _
            "CU-01 Registrarse: RegistroController", _
            Array("- servicioRegistro: Servicio"), _
            Array("+ validarDatos(): boolean", "+ registrar(): void", "+ confirmarRegistro(): void") _
        ), _
        Array( _
            "CU-01 Registrarse: Usuario", _
            Array("- id: int", "- nombre: string", "- email: string", "- passwordHash: string", "- fechaRegistro: Date", "- activo: boolean"), _
            Array("+ crear(): void", "+ buscarPorEmail(): Usuario", "+ guardar(): void") _
        ) _
    )
    getCU01 = Array("Cliente", metodosActor, clases, "CU-01 - Registrarse en la plataforma")
end function

function getCU02()
    ' CU-02 Iniciar sesión
    dim metodosActor, clases
    metodosActor = Array("+ ingresarCredenciales(): void", "+ solicitarRecuperacion(): void")
    
    clases = Array( _
        Array( _
            "CU-02 Iniciar sesión: UI_Login", _
            Array("- formularioLogin: Form"), _
            Array("+ mostrarLogin(): void", "+ enviarCredenciales(): void", "+ mostrarError(): void") _
        ), _
        Array( _
            "CU-02 Iniciar sesión: LoginController", _
            Array("- servicioAutenticacion: Servicio"), _
            Array("+ autenticar(): boolean", "+ generarToken(): string", "+ validarCredenciales(): boolean") _
        ), _
        Array( _
            "CU-02 Iniciar sesión: Usuario", _
            Array("- email: string", "- passwordHash: string", "- activo: boolean", "- rol: string"), _
            Array("+ buscarPorEmail(): Usuario", "+ verificarPassword(): boolean", "+ obtenerRol(): string") _
        ) _
    )
    getCU02 = Array("Cliente", metodosActor, clases, "CU-02 - Iniciar sesión")
end function

function getCU03()
    ' CU-03 Gestionar perfil de usuario
    dim metodosActor, clases
    metodosActor = Array("+ verPerfil(): void", "+ editarPerfil(): void", "+ guardarCambios(): void")
    
    clases = Array( _
        Array( _
            "CU-03 Gestionar perfil: UI_Perfil", _
            Array("- formularioPerfil: Form"), _
            Array("+ mostrarPerfil(): void", "+ cargarDatos(): void", "+ enviarActualizacion(): void") _
        ), _
        Array( _
            "CU-03 Gestionar perfil: PerfilController", _
            Array("- servicioUsuario: Servicio"), _
            Array("+ obtenerPerfil(): Usuario", "+ actualizarPerfil(): void", "+ validarDatos(): boolean") _
        ), _
        Array( _
            "CU-03 Gestionar perfil: Usuario", _
            Array("- id: int", "- nombre: string", "- email: string", "- telefono: string", "- direccion: string"), _
            Array("+ actualizar(): void", "+ obtenerDatos(): Usuario", "+ validar(): boolean") _
        ) _
    )
    getCU03 = Array("Cliente", metodosActor, clases, "CU-03 - Gestionar perfil de usuario")
end function

function getCU04()
    ' CU-04 Consultar catálogo de prendas
    dim metodosActor, clases
    metodosActor = Array("+ navegarCatalogo(): void", "+ seleccionarProducto(): void", "+ verDetalle(): void")
    
    clases = Array( _
        Array( _
            "CU-04 Consultar catálogo: UI_Catalogo", _
            Array("- listaProductos: List<Producto>"), _
            Array("+ mostrarCatalogo(): void", "+ cargarProductos(): void", "+ mostrarDetalle(): void") _
        ), _
        Array( _
            "CU-04 Consultar catálogo: CatalogoController", _
            Array("- servicioCatalogo: Servicio"), _
            Array("+ obtenerProductos(): List<Producto>", "+ obtenerDetalle(): Producto", "+ aplicarFiltros(): List<Producto>") _
        ), _
        Array( _
            "CU-04 Consultar catálogo: Producto", _
            Array("- id: int", "- nombre: string", "- descripcion: string", "- precio: double", "- imagen: string", "- activo: boolean"), _
            Array("+ getDatos(): Producto", "+ listarActivos(): List<Producto>") _
        ) _
    )
    getCU04 = Array("Cliente", metodosActor, clases, "CU-04 - Consultar catálogo de prendas")
end function

function getCU05()
    ' CU-05 Filtrar productos
    dim metodosActor, clases
    metodosActor = Array("+ seleccionarFiltros(): void", "+ aplicarFiltro(): void", "+ verResultados(): void")
    
    clases = Array( _
        Array( _
            "CU-05 Filtrar productos: UI_Catalogo", _
            Array("- filtros: Filtros", "- resultados: List<Producto>"), _
            Array("+ mostrarFiltros(): void", "+ aplicarFiltros(): void", "+ mostrarResultados(): void") _
        ), _
        Array( _
            "CU-05 Filtrar productos: CatalogoController", _
            Array("- servicioCatalogo: Servicio"), _
            Array("+ aplicarFiltros(): List<Producto>", "+ obtenerCategorias(): List<Categoria>", "+ obtenerTallas(): List<Talla>") _
        ), _
        Array( _
            "CU-05 Filtrar productos: Producto", _
            Array("- id: int", "- nombre: string", "- precio: double", "- categoria: Categoria", "- tallas: List<Talla>", "- colores: List<Color>", "- temporada: Temporada"), _
            Array("+ filtrarPor(): List<Producto>") _
        ) _
    )
    getCU05 = Array("Cliente", metodosActor, clases, "CU-05 - Filtrar productos por talla, color, categoría, temporada")
end function

function getCU06()
    ' CU-06 Consultar disponibilidad por sucursal
    dim metodosActor, clases
    metodosActor = Array("+ seleccionarProducto(): void", "+ seleccionarSucursal(): void", "+ consultarDisponibilidad(): void")
    
    clases = Array( _
        Array( _
            "CU-06 Consultar disponibilidad: UI_Disponibilidad", _
            Array("- productoSeleccionado: Producto", "- sucursalSeleccionada: Sucursal"), _
            Array("+ mostrarFormulario(): void", "+ cargarProductos(): void", "+ cargarSucursales(): void", "+ mostrarDisponibilidad(): void") _
        ), _
        Array( _
            "CU-06 Consultar disponibilidad: InventarioController", _
            Array("- servicioInventario: Servicio"), _
            Array("+ obtenerDisponibilidad(): Inventario", "+ consultarStock(): int") _
        ), _
        Array( _
            "CU-06 Consultar disponibilidad: Inventario", _
            Array("- productoId: int", "- sucursalId: int", "- cantidadDisponible: int", "- cantidadReservada: int"), _
            Array("+ getStock(): int", "+ getDisponible(): int") _
        ), _
        Array( _
            "CU-06 Consultar disponibilidad: Sucursal", _
            Array("- id: int", "- nombre: string", "- direccion: string", "- ciudad: string"), _
            Array("+ listarSucursales(): List<Sucursal>") _
        ) _
    )
    getCU06 = Array("Cliente", metodosActor, clases, "CU-06 - Consultar disponibilidad por sucursal")
end function

function getCU08()
    ' CU-08 Realizar reserva de múltiples prendas
    dim metodosActor, clases
    metodosActor = Array("+ seleccionarPrendas(): void", "+ elegirSucursal(): void", "+ confirmarReserva(): void")
    
    clases = Array( _
        Array( _
            "CU-08 Realizar reserva: UI_Reserva", _
            Array("- carrito: List<ItemReserva>", "- sucursal: Sucursal", "- fechaHora: DateTime"), _
            Array("+ mostrarCarrito(): void", "+ seleccionarSucursal(): void", "+ confirmar(): void", "+ mostrarConfirmacion(): void") _
        ), _
        Array( _
            "CU-08 Realizar reserva: ReservaController", _
            Array("- servicioReserva: Servicio", "- servicioInventario: Servicio"), _
            Array("+ verificarStock(): boolean", "+ crearReserva(): Reserva", "+ notificarEncargado(): void") _
        ), _
        Array( _
            "CU-08 Realizar reserva: Reserva", _
            Array("- id: int", "- clienteId: int", "- sucursalId: int", "- fechaHora: DateTime", "- estado: string", "- items: List<ItemReserva>"), _
            Array("+ crear(): void", "+ actualizarEstado(): void") _
        ), _
        Array( _
            "CU-08 Realizar reserva: Inventario", _
            Array("- productoId: int", "- sucursalId: int", "- cantidadDisponible: int", "- cantidadReservada: int"), _
            Array("+ reservar(): void", "+ liberarReserva(): void") _
        ) _
    )
    getCU08 = Array("Cliente", metodosActor, clases, "CU-08 - Realizar reserva de múltiples prendas")
end function

function getCU09()
    ' CU-09 Consultar y cancelar reservas
    dim metodosActor, clases
    metodosActor = Array("+ verReservas(): void", "+ seleccionarReserva(): void", "+ cancelarReserva(): void")
    
    clases = Array( _
        Array( _
            "CU-09 Consultar reservas: UI_Reservas", _
            Array("- listaReservas: List<Reserva>"), _
            Array("+ mostrarReservas(): void", "+ mostrarDetalle(): void", "+ confirmarCancelacion(): void") _
        ), _
        Array( _
            "CU-09 Consultar reservas: ReservaController", _
            Array("- servicioReserva: Servicio", "- servicioInventario: Servicio"), _
            Array("+ obtenerReservas(): List<Reserva>", "+ cancelarReserva(): void", "+ liberarStock(): void") _
        ), _
        Array( _
            "CU-09 Consultar reservas: Reserva", _
            Array("- id: int", "- clienteId: int", "- fechaHora: DateTime", "- estado: string", "- items: List<ItemReserva>"), _
            Array("+ cancelar(): void", "+ getEstado(): string") _
        ) _
    )
    getCU09 = Array("Cliente", metodosActor, clases, "CU-09 - Consultar y cancelar reservas")
end function

function getCU18()
    ' CU-18 Preparar reservas (Encargado)
    dim metodosActor, clases
    metodosActor = Array("+ verPendientes(): void", "+ seleccionarReserva(): void", "+ marcarPreparada(): void")
    
    clases = Array( _
        Array( _
            "CU-18 Preparar reservas: UI_Reservas", _
            Array("- reservasPendientes: List<Reserva>"), _
            Array("+ mostrarPendientes(): void", "+ mostrarDetalle(): void", "+ confirmarPreparacion(): void") _
        ), _
        Array( _
            "CU-18 Preparar reservas: ReservaController", _
            Array("- servicioReserva: Servicio"), _
            Array("+ obtenerPendientes(): List<Reserva>", "+ prepararReserva(): void", "+ notificarCliente(): void") _
        ), _
        Array( _
            "CU-18 Preparar reservas: Reserva", _
            Array("- id: int", "- clienteId: int", "- sucursalId: int", "- fechaHora: DateTime", "- estado: string"), _
            Array("+ preparar(): void", "+ getItems(): List<ItemReserva>") _
        ) _
    )
    getCU18 = Array("Encargado", metodosActor, clases, "CU-18 - Preparar reservas (Encargado)")
end function

function getCU19()
    ' CU-19 Administrar usuarios y roles
    dim metodosActor, clases
    metodosActor = Array("+ verUsuarios(): void", "+ crearUsuario(): void", "+ editarUsuario(): void", "+ eliminarUsuario(): void")
    
    clases = Array( _
        Array( _
            "CU-19 Administrar usuarios: UI_Usuarios", _
            Array("- listaUsuarios: List<Usuario>", "- roles: List<Rol>"), _
            Array("+ mostrarUsuarios(): void", "+ mostrarFormularioCrear(): void", "+ mostrarFormularioEditar(): void", "+ confirmarEliminacion(): void") _
        ), _
        Array( _
            "CU-19 Administrar usuarios: UsuarioController", _
            Array("- servicioUsuario: Servicio", "- servicioRol: Servicio"), _
            Array("+ obtenerUsuarios(): List<Usuario>", "+ crearUsuario(): void", "+ actualizarUsuario(): void", "+ eliminarUsuario(): void") _
        ), _
        Array( _
            "CU-19 Administrar usuarios: Usuario", _
            Array("- id: int", "- nombre: string", "- email: string", "- rolId: int", "- activo: boolean"), _
            Array("+ crear(): void", "+ actualizar(): void", "+ eliminar(): void") _
        ), _
        Array( _
            "CU-19 Administrar usuarios: Rol", _
            Array("- id: int", "- nombre: string", "- permisos: List<Permiso>"), _
            Array("+ listarRoles(): List<Rol>", "+ asignarPermisos(): void") _
        ) _
    )
    getCU19 = Array("Administrador", metodosActor, clases, "CU-19 - Administrar usuarios y roles")
end function

function getCU20()
    ' CU-20 Administrar sucursales
    dim metodosActor, clases
    metodosActor = Array("+ verSucursales(): void", "+ crearSucursal(): void", "+ editarSucursal(): void", "+ eliminarSucursal(): void")
    
    clases = Array( _
        Array( _
            "CU-20 Administrar sucursales: UI_Sucursales", _
            Array("- listaSucursales: List<Sucursal>"), _
            Array("+ mostrarSucursales(): void", "+ mostrarFormularioCrear(): void", "+ mostrarFormularioEditar(): void", "+ confirmarEliminacion(): void") _
        ), _
        Array( _
            "CU-20 Administrar sucursales: SucursalController", _
            Array("- servicioSucursal: Servicio"), _
            Array("+ obtenerSucursales(): List<Sucursal>", "+ crearSucursal(): void", "+ actualizarSucursal(): void", "+ eliminarSucursal(): void") _
        ), _
        Array( _
            "CU-20 Administrar sucursales: Sucursal", _
            Array("- id: int", "- nombre: string", "- direccion: string", "- telefono: string", "- ciudad: string", "- horarioApertura: Time", "- horarioCierre: Time", "- activo: boolean"), _
            Array("+ crear(): void", "+ actualizar(): void", "+ eliminar(): void") _
        ) _
    )
    getCU20 = Array("Administrador", metodosActor, clases, "CU-20 - Administrar sucursales")
end function

function getCU21()
    ' CU-21 Administrar catálogo de productos (CRUD)
    dim metodosActor, clases
    metodosActor = Array("+ verProductos(): void", "+ crearProducto(): void", "+ editarProducto(): void", "+ eliminarProducto(): void")
    
    clases = Array( _
        Array( _
            "CU-21 Administrar catálogo: UI_Catalogo", _
            Array("- listaProductos: List<Producto>", "- categorias: List<Categoria>"), _
            Array("+ mostrarProductos(): void", "+ mostrarFormularioCrear(): void", "+ mostrarFormularioEditar(): void", "+ confirmarEliminacion(): void") _
        ), _
        Array( _
            "CU-21 Administrar catálogo: CatalogoController", _
            Array("- servicioCatalogo: Servicio", "- servicioCategoria: Servicio"), _
            Array("+ obtenerProductos(): List<Producto>", "+ crearProducto(): void", "+ actualizarProducto(): void", "+ eliminarProducto(): void") _
        ), _
        Array( _
            "CU-21 Administrar catálogo: Producto", _
            Array("- id: int", "- nombre: string", "- descripcion: string", "- precio: double", "- categoriaId: int", "- imagen: string", "- modelo3D: string", "- activo: boolean"), _
            Array("+ crear(): void", "+ actualizar(): void", "+ eliminar(): void") _
        ), _
        Array( _
            "CU-21 Administrar catálogo: Categoria", _
            Array("- id: int", "- nombre: string", "- descripcion: string"), _
            Array("+ listarCategorias(): List<Categoria>") _
        ) _
    )
    getCU21 = Array("Administrador", metodosActor, clases, "CU-21 - Administrar catálogo de productos (CRUD)")
end function

' -------------------------------------------------------------
' Función principal para crear cada diagrama de clases
' -------------------------------------------------------------

sub crearDiagramaCasoUso(package, nombreActor, metodosActor, clases, nombreDiagrama)
    ' 1. Crear el actor con sus métodos
    dim actor
    set actor = crearElemento(package, nombreActor, "Actor")
    dim m
    for each m in metodosActor
        agregarMetodo actor, m
    next

    ' 2. Crear las clases con sus atributos y métodos
    dim claseInfo, nombreClase, atributos, metodos, claseObj
    dim listaClases
    listaClases = Array()
    for each claseInfo in clases
        nombreClase = claseInfo(0)
        atributos = claseInfo(1)
        metodos = claseInfo(2)
        set claseObj = crearClase(package, nombreClase)
        dim a
        for each a in atributos
            agregarAtributo claseObj, a
        next
        for each m in metodos
            agregarMetodo claseObj, m
        next
        ' Guardar referencia para posicionar después
        if UBound(listaClases) < 0 then
            ReDim listaClases(0)
        else
            ReDim Preserve listaClases(UBound(listaClases) + 1)
        end if
        set listaClases(UBound(listaClases)) = claseObj
    next

    ' 3. Crear el diagrama de clases
    dim diagram
    set diagram = crearDiagramaLimpio(package, nombreDiagrama)

    ' 4. Posicionar elementos: actor a la izquierda, clases en fila horizontal
    colocarElemento diagram, actor, "50", "150", "-50", "-200"
    
    dim x, y, i, claseActual
    x = 250
    y = -100
    for i = 0 to UBound(listaClases)
        set claseActual = listaClases(i)
        ' Ajustar altura según cantidad de métodos
        dim altura
        altura = 120 + (claseActual.Methods.Count * 20)
        colocarElemento diagram, claseActual, x, x + 200, y, y - altura
        x = x + 250
    next

    ' 5. Crear asociaciones: actor -> primera clase, y entre clases secuencialmente
    if UBound(listaClases) >= 0 then
        crearAsociacion actor, listaClases(0), ""
        for i = 0 to UBound(listaClases) - 1
            crearAsociacion listaClases(i), listaClases(i + 1), ""
        next
    end if

    ' 6. Guardar y refrescar el diagrama
    Repository.SaveDiagram diagram.DiagramID
    Repository.ReloadDiagram diagram.DiagramID
    Repository.OpenDiagram diagram.DiagramID
end sub

' -------------------------------------------------------------
' Funciones auxiliares (sin estereotipos)
' -------------------------------------------------------------

function crearElemento(package, name, tipo)
    dim el
    for each el in package.Elements
        if el.Name = name and el.Type = tipo then
            set crearElemento = el
            exit function
        end if
    next
    set el = package.Elements.AddNew(name, tipo)
    el.Update()
    package.Elements.Refresh()
    set crearElemento = el
end function

function crearClase(package, name)
    dim el
    for each el in package.Elements
        if el.Name = name and el.Type = "Class" then
            set crearClase = el
            exit function
        end if
    next
    set el = package.Elements.AddNew(name, "Class")
    el.Update()
    package.Elements.Refresh()
    set crearClase = el
end function

sub agregarAtributo(clase, nombre)
    dim attr
    for each attr in clase.Attributes
        if attr.Name = nombre then exit sub
    next
    set attr = clase.Attributes.AddNew(nombre, "")
    attr.Update()
    clase.Attributes.Refresh()
end sub

sub agregarMetodo(elemento, nombre)
    dim method
    if elemento.Type = "Actor" then
        for each method in elemento.Methods
            if method.Name = nombre then exit sub
        next
        set method = elemento.Methods.AddNew(nombre, "")
        method.Update()
        elemento.Methods.Refresh()
    else
        for each method in elemento.Methods
            if method.Name = nombre then exit sub
        next
        set method = elemento.Methods.AddNew(nombre, "")
        method.Update()
        elemento.Methods.Refresh()
    end if
end sub

function crearDiagramaLimpio(package, name)
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
    set diag = package.Diagrams.AddNew(name, "Class")
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