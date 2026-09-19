/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU11 - Consultar disponibilidad por sucursal
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * CORRECCIONES APLICADAS:
 * 1. Corrección de API: Se usa pkg.Diagrams.Delete(i) en lugar de RemoveAt (método inexistente en EA COM API).
 * 2. Visualización de fragmentos alt y loop: Se crean los InteractionFragment nativos con estereotipo,
 *    sin alterar propiedades de Subtype que provocaban corrupción de memoria en EA 15.
 * 3. Actor tipo "Actor" nativo con ícono de muñeco y nombre centrado.
 * 4. Participantes BCE rectangulares (:UI, :Ctrl, :Entidades).
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU11 - Consultar Disponibilidad por Sucursal";

function log(msg) {
    Session.Output("[CU11-Secuencia] " + msg);
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
 * Recrea el diagrama limpio usando pkg.Diagrams.Delete(i) (método oficial de la API de EA).
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-950;", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

/**
 * Agrega participante con encabezado rectangular (Boundary, Control, Entity).
 */
function addParticipant(pkg, diagram, name, stereotype, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-950;", "");
    dObj.ElementID = el.ElementID;
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
        } catch (e) {}
    }
    con.Update();
    return con;
}

/**
 * Agrega fragmentos combinados (alt, loop) de forma segura y estable en EA 15.
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
    log("Iniciando generación estable de diagrama de secuencia BCE para CU11...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE (Distribución horizontal: Actor -> UI -> Ctrl -> Entidades)
     * ------------------------------------------------------------------------- */
    var actorCliente  = addActorParticipant(pkg, diagram, "Cliente",                    40,  90);
    var uiCatalogo    = addParticipant(pkg, diagram, ":UI_ConsultarDisponibilidad", "Interface",  220, 190);
    var ctrlCatalogo  = addParticipant(pkg, diagram, ":Ctrl_ConsultarDisponibilidad","Controller",460, 200);
    var entSucursal   = addParticipant(pkg, diagram, ":Sucursal",                   "Entity",     710, 130);
    var entProducto   = addParticipant(pkg, diagram, ":Producto",                   "Entity",     890, 130);
    var entVariante   = addParticipant(pkg, diagram, ":Variante",                   "Entity",     1070,130);
    var entInventario = addParticipant(pkg, diagram, ":Inventario",                 "Entity",     1250,140);

    /* -------------------------------------------------------------------------
     * 2. FRAGMENTOS COMBINADOS UML (alt y loop)
     * ------------------------------------------------------------------------- */
    // Fragmento alt: encapsula la consulta condicional a la entidad Variante
    addCombinedFragment(pkg, diagram, "alt", "alt [con filtros de talla o color]", 440, 1220, -250, -360);

    // Fragmento loop: encapsula la asociación de stock producto por producto
    addCombinedFragment(pkg, diagram, "loop", "loop [por cada producto]", 440, 1040, -470, -580);

    /* -------------------------------------------------------------------------
     * 3. FLUJO DE MENSAJES NUMERADOS
     * ------------------------------------------------------------------------- */
    var step = 1;

    // 1. El cliente interactúa con la interfaz
    addMessage(actorCliente, uiCatalogo,
        "1: consultarDisponibilidad()", false, step++);

    // 1.1 Solicitud desde la interfaz al controlador
    addMessage(uiCatalogo, ctrlCatalogo,
        "1.1: getAvailability()", false, step++);

    // 1.2 El controlador valida la sucursal seleccionada
    addMessage(ctrlCatalogo, entSucursal,
        "1.2: verificarSucursalActiva()", false, step++);

    // 1.3 Retorno de estado de la sucursal hacia el controlador
    addMessage(entSucursal, ctrlCatalogo,
        "1.3: return(sucursal_activa)", true, step++);

    // 1.4 El controlador consulta los productos activos
    addMessage(ctrlCatalogo, entProducto,
        "1.4: obtenerProductosActivos()", false, step++);

    // 1.5 Retorno de productos hacia el controlador
    addMessage(entProducto, ctrlCatalogo,
        "1.5: return(productos)", true, step++);

    // 1.6 alt: Si hay filtros, solicitar filtrar a la entidad Variante
    addMessage(ctrlCatalogo, entVariante,
        "1.6: filtrarPorTallaColor()", false, step++);

    // 1.7 Retorno de variantes filtradas hacia el controlador
    addMessage(entVariante, ctrlCatalogo,
        "1.7: return(variantes_coincidentes)", true, step++);

    // 1.8 El controlador consulta el stock en la entidad Inventario para esa sucursal
    addMessage(ctrlCatalogo, entInventario,
        "1.8: consultarStockPorSucursal()", false, step++);

    // 1.9 Retorno del stock disponible hacia el controlador
    addMessage(entInventario, ctrlCatalogo,
        "1.9: return(stock_disponible)", true, step++);

    // 1.10 loop: Por cada producto, el controlador asocia su disponibilidad
    addMessage(ctrlCatalogo, entProducto,
        "1.10: asociarDisponibilidad()", false, step++);

    // 1.11 Retorno del producto con su stock hacia el controlador
    addMessage(entProducto, ctrlCatalogo,
        "1.11: return(producto_con_stock)", true, step++);

    // 1.12 Retorno de resultados consolidados hacia la interfaz
    addMessage(ctrlCatalogo, uiCatalogo,
        "1.12: return(lista_disponibilidad)", true, step++);

    // 1.13 La interfaz renderiza la disponibilidad al cliente
    addMessage(uiCatalogo, actorCliente,
        "1.13: renderizarDisponibilidad()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU11 generado con éxito en Enterprise Architect!", 0);
}

main();