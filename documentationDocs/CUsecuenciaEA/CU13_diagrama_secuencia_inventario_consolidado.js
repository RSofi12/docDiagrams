/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU13 - Consultar inventario consolidado
 * DESCRIPCIÓN: Vista global de existencias de todas las sucursales.
 * ACTOR: Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * CORRECCIÓN DE SECUENCIA:
 * - El fragmento 'alt' se declara y crea en el código DESPUÉS del mensaje GET 1.1.
 * - Coordenadas del alt: top = -190 (muy por debajo de la segunda línea de texto de 1.1)
 *   y left = 440 (comenzando en el controlador, dejando fuera a la interfaz y toda la flecha GET).
 * - Entidades en RECUADROS RECTANGULARES con cabecera <<Entity>> y :Nombre mediante
 *   addEntityParticipant (Entity\u00A0).
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU13 - Consultar Inventario Consolidado";

function log(msg) {
    Session.Output("[CU13-Secuencia] " + msg);
}

/**
 * Obtiene el paquete de destino en el Project Browser.
 */
function getTargetPackage() {
    var selectedPkg = Repository.GetTreeSelectedPackage();
    if (selectedPkg != null) {
        log("Usando paquete seleccionado en Project Browser: " + selectedPkg.Name);
        return selectedPkg;
    }

    var roots = Repository.Models;
    var root = (roots.Count > 0) ? roots.GetAt(0) : null;
    if (root == null) {
        Session.Prompt("No se encontró ningún modelo raíz en Enterprise Architect.", 0);
        return null;
    }

    for (var i = 0; i < root.Packages.Count; i++) {
        var p = root.Packages.GetAt(i);
        if (p.Name == DEFAULT_PACKAGE_NAME) {
            return p;
        }
    }

    var newPkg = root.Packages.AddNew(DEFAULT_PACKAGE_NAME, "Package");
    newPkg.Update();
    root.Packages.Refresh();
    log("Paquete creado: " + DEFAULT_PACKAGE_NAME);
    return newPkg;
}

/**
 * Recrea el diagrama limpio usando pkg.Diagrams.Delete(i).
 */
function recreateDiagram(pkg) {
    for (var i = pkg.Diagrams.Count - 1; i >= 0; i--) {
        var d = pkg.Diagrams.GetAt(i);
        if (d.Name == DIAGRAM_NAME) {
            try {
                pkg.Diagrams.Delete(i);
                pkg.Diagrams.Refresh();
                log("Diagrama previo eliminado para regeneración limpia.");
            } catch (e) {
                log("Aviso al eliminar: " + e.message);
            }
            break;
        }
    }

    var diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Sequence");
    try {
        diagram.StyleEx = "ShowRobustness=0;SequenceCustomArt=0;";
    } catch (e) { }
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

/**
 * Agrega el Actor con su ícono estándar UML (muñeco) y nombre centrado sobre la línea de vida.
 */
function addActorParticipant(pkg, diagram, name, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Actor");
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-1200;", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

/**
 * Agrega participante con encabezado RECTANGULAR (Boundary, Controller).
 */
function addParticipant(pkg, diagram, name, stereotype, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1200;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

/**
 * Agrega participantes Entidades en RECUADRO RECTANGULAR idéntico al controller/interface.
 * El uso del espacio no rompible (\u00A0) evita que EA aplique el icono circular de Robustness,
 * renderizando el recuadro estándar con <<Entity>> y :Nombre.
 */
function addEntityParticipant(pkg, diagram, name, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    el.Stereotype = "Entity" + String.fromCharCode(160);
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1200;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

/**
 * Agrega mensaje de secuencia. isReturn = true crea la flecha discontinua de retorno.
 */
function addMessage(src, dst, label, isReturn, sequenceNo) {
    var con = src.Connectors.AddNew(label, "Sequence");
    con.SupplierID = dst.ElementID;
    if (isReturn) {
        con.Stereotype = "return";
    }
    if (sequenceNo) {
        try {
            con.SequenceNo = sequenceNo;
        } catch (e) { }
    }
    con.Update();
    return con;
}

/**
 * Agrega fragmentos combinados (alt, loop).
 */
function addCombinedFragment(pkg, diagram, type, guardLabel, left, right, top, bottom) {
    try {
        var frag = pkg.Elements.AddNew(guardLabel, "InteractionFragment");
        frag.Stereotype = type; // "alt" o "loop"
        frag.Update();

        var dObj = diagram.DiagramObjects.AddNew("l=" + left + ";r=" + right + ";t=" + top + ";b=" + bottom + ";", "");
        dObj.ElementID = frag.ElementID;
        dObj.Update();
        return frag;
    } catch (err) {
        log("Nota al crear fragmento (" + type + "): " + err.message);
        return null;
    }
}

function main() {
    log("Iniciando generación corregida de CU13 con orden cronológico de fragmentos...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE (Todos en RECUADROS RECTANGULARES)
     * Actor -> Boundary -> Controller -> Entities
     * ------------------------------------------------------------------------- */
    var actorAdmin = addActorParticipant(pkg, diagram, "Administrador", 40, 90);
    var uiInventario = addParticipant(pkg, diagram, ":AdminInventoryPageComponent", "Interface", 190, 210);
    var ctrlInventario = addParticipant(pkg, diagram, ":InventoryController", "Controller", 460, 180);

    // 6 Entidades en recuadros rectangulares con cabecera <<Entity>>
    var entInventario = addEntityParticipant(pkg, diagram, ":Inventario", 700, 130);
    var entVariante = addEntityParticipant(pkg, diagram, ":Variante", 880, 130);
    var entProducto = addEntityParticipant(pkg, diagram, ":Producto", 1060, 130);
    var entSucursal = addEntityParticipant(pkg, diagram, ":Sucursal", 1240, 130);
    var entTalla = addEntityParticipant(pkg, diagram, ":Talla", 1420, 120);
    var entColor = addEntityParticipant(pkg, diagram, ":Color", 1590, 120);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO INICIAL: FUERA DEL ALT
     * ------------------------------------------------------------------------- */

    // 1. El Administrador ingresa a la vista de inventario consolidado
    addMessage(actorAdmin, uiInventario,
        "1: consultarInventarioConsolidado()", false, step++);

    // 1.1 Solicitud GET HTTP al backend (TOTALMENTE FUERA Y ANTES DEL ALT)
    addMessage(uiInventario, ctrlInventario,
        "1.1: GET /inventory/consolidated (InventoryApiService.getConsolidatedStock)", false, step++);

    /* -------------------------------------------------------------------------
     * 3. FRAGMENTO ALT: DECLARADO CRONOLÓGICAMENTE DESPUÉS DEL GET 1.1
     * Comienza en el controlador (left = 440) y con top = -190 para quedar
     * con holgura limpia por debajo del texto de dos líneas de 1.1.
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[Autenticación y Rol == administrador]", 440, 1730, -190, -940);

    // 1.2 El controlador consulta existencias físicas y reservadas
    addMessage(ctrlInventario, entInventario,
        "1.2: obtenerExistenciasPorSucursal()", false, step++);

    // 1.3 Retorno de registros de inventario
    addMessage(entInventario, ctrlInventario,
        "1.3: return(registros_inventario)", true, step++);

    // 1.4 El controlador consulta el detalle de variantes activas
    addMessage(ctrlInventario, entVariante,
        "1.4: obtenerDetalleVariantes()", false, step++);

    // 1.5 Retorno de variantes (SKU, precio, imagen)
    addMessage(entVariante, ctrlInventario,
        "1.5: return(lista_variantes)", true, step++);

    // 1.6 El controlador consulta los productos base
    addMessage(ctrlInventario, entProducto,
        "1.6: obtenerDatosProductos()", false, step++);

    // 1.7 Retorno de nombres y categorías de productos
    addMessage(entProducto, ctrlInventario,
        "1.7: return(datos_productos)", true, step++);

    // 1.8 El controlador consulta las sucursales del sistema
    addMessage(ctrlInventario, entSucursal,
        "1.8: obtenerSucursales()", false, step++);

    // 1.9 Retorno de sucursales (ID, nombre, ciudad)
    addMessage(entSucursal, ctrlInventario,
        "1.9: return(lista_sucursales)", true, step++);

    // 1.10 El controlador consulta el catálogo de tallas
    addMessage(ctrlInventario, entTalla,
        "1.10: obtenerTallas()", false, step++);

    // 1.11 Retorno de tallas asociadas
    addMessage(entTalla, ctrlInventario,
        "1.11: return(lista_tallas)", true, step++);

    // 1.12 El controlador consulta el catálogo de colores
    addMessage(ctrlInventario, entColor,
        "1.12: obtenerColores()", false, step++);

    // 1.13 Retorno de colores asociados
    addMessage(entColor, ctrlInventario,
        "1.13: return(lista_colores)", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FRAGMENTO LOOP: DECLARADO CRONOLÓGICAMENTE ANTES DEL MENSAJE 1.14
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "loop", "[por cada variante y sucursal]", 440, 710, -780, -880);

    // loop [por cada variante y sucursal]
    // 1.14 El controlador totaliza stock físico, reservado y disponible
    addMessage(ctrlInventario, ctrlInventario,
        "1.14: consolidarStockPorSucursal()", false, step++);

    // 1.15 Retorno interno de la estructura consolidada
    addMessage(ctrlInventario, ctrlInventario,
        "1.15: return(consolidatedStock)", true, step++);

    // 1.16 Retorno HTTP 200 con la respuesta consolidada hacia la interfaz
    addMessage(ctrlInventario, uiInventario,
        "1.16: return 200 OK (consolidatedStock)", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FLUJO FINAL EN LA INTERFAZ (FUERA DEL ALT)
     * ------------------------------------------------------------------------- */

    // 1.17 La interfaz calcula los totales globales (totalVariants, totalQuantity, etc.)
    addMessage(uiInventario, uiInventario,
        "1.17: calcularTotalesGlobales()", false, step++);

    // 1.18 La interfaz renderiza la tabla consolidada para el Administrador
    addMessage(uiInventario, actorAdmin,
        "1.18: renderizarInventarioConsolidado()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU13 con orden cronológico y alt corregido generado con éxito!", 0);
}

main();
