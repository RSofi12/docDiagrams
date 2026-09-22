/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU12 - Registrar movimiento de inventario
 * DESCRIPCIÓN: Registro de ingresos, salidas y traspasos entre sucursales.
 * ACTOR: Encargado de sucursal, Cajero
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * LAYOUT DE ACTORES:
 * - Encargado de sucursal: actor principal, a la IZQUIERDA (x=25); registra ingresos,
 *   salidas y traspasos (única implementación real en el código).
 * - Cajero: actor secundario, a la DERECHA (x=1790) para que sus lifelines NO se crucen
 *   con el flujo del Encargado; su única acción real en el CU es consultar movimientos
 *   (GET /inventory/movements, roles admin/encargado/cajero).
 * - El diagrama SIEMPRE cierra con un mensaje final hacia el actor que solicitó la
 *   interacción (render/confirmación en la interfaz). Ese mensaje final es una convención
 *   de modelado de la capa UI: no corresponde a una función del backend.
 *
 * IMPLEMENTACIÓN REFERENCIADA (backend/app):
 * - routes/inventory_routes.py  -> income_route, outcome_route, transfer_route, movements_route
 * - services/inventory_service.py -> register_income, register_outcome, register_transfer,
 *   _get_or_create_inventory, _inventory_available, list_movements
 * - models (nombres reales): InventoryMovement, Inventory
 *   (InventoryMovement referencia por FK a ProductVariant y Branch, pero el flujo
 *    del CU12 no consulta esas tablas; por eso no participan en este diagrama)
 *
 * CORRECCIÓN DE SECUENCIA (mismo criterio que CU13):
 * - Cada fragmento 'alt' se declara y crea en el código DESPUÉS del mensaje que lo precede,
 *   y sus coordenadas top/bottom cubren únicamente su banda vertical de mensajes.
 * - Entidades en RECUADROS RECTANGULARES con cabecera <<Entity>> y :Nombre mediante
 *   addEntityParticipant (Entity\u00A0).
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU12 - Registrar Movimiento de Inventario";

function log(msg) {
    Session.Output("[CU12-Secuencia] " + msg);
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
function addActorParticipant(pkg, diagram, name, leftX, width, bottom) {
    var el = pkg.Elements.AddNew(name, "Actor");
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=" + bottom + ";", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

/**
 * Agrega participante con encabezado RECTANGULAR (Boundary, Controller).
 */
function addParticipant(pkg, diagram, name, stereotype, leftX, width, bottom) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=" + bottom + ";", "");
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
function addEntityParticipant(pkg, diagram, name, leftX, width, bottom) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    el.Stereotype = "Entity" + String.fromCharCode(160);
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=" + bottom + ";", "");
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
 * Agrega fragmentos combinados (alt).
 */
function addCombinedFragment(pkg, diagram, type, guardLabel, left, right, top, bottom) {
    try {
        var frag = pkg.Elements.AddNew(guardLabel, "InteractionFragment");
        frag.Stereotype = type; // "alt"
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
    log("Iniciando generación de CU12 con orden cronológico de fragmentos...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE (Todos en RECUADROS RECTANGULARES)
     * Actor -> Boundary -> Controller -> Service -> Entities
     * ------------------------------------------------------------------------- */
    var bottom = -3400;

    var actorEncargado = addActorParticipant(pkg, diagram, "Encargado de sucursal", 25, 95, bottom);
    // Actor secundario ubicado a la DERECHA del diagrama: así sus mensajes no se cruzan
    // con la lifeline del Encargado (su única acción real en el CU es consultar movimientos).
    var actorCajero = addActorParticipant(pkg, diagram, "Cajero", 1790, 85, bottom);

    var uiMovimiento = addParticipant(pkg, diagram, ":InventoryMovementPageComponent", "Interface", 320, 220, bottom);
    var ctrlInventario = addParticipant(pkg, diagram, ":InventoryController", "Controller", 620, 200, bottom);
    var svcInventario = addParticipant(pkg, diagram, ":InventoryService", "Controller", 900, 190, bottom);

    // 2 Entidades en recuadros rectangulares con cabecera <<Entity>>
    var entMovimiento = addEntityParticipant(pkg, diagram, ":InventoryMovement", 1170, 170, bottom);
    var entInventario = addEntityParticipant(pkg, diagram, ":Inventory", 1430, 110, bottom);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO INICIAL: FUERA DEL ALT
     * ------------------------------------------------------------------------- */

    // 1. El Encargado de sucursal elige el tipo de movimiento (ingreso/salida/traspaso)
    addMessage(actorEncargado, uiMovimiento,
        "1: registrarMovimiento()", false, step++);

    // 1.1 Solicitud POST HTTP al backend (TOTALMENTE FUERA Y ANTES DEL ALT)
    addMessage(uiMovimiento, ctrlInventario,
        "1.1: POST /inventory/movements/{income|outcome|transfer} (InventoryApiService)", false, step++);

    /* -------------------------------------------------------------------------
     * 3. FRAGMENTO ALT: [TipoMovimiento == income]
     * Declarado cronológicamente después del POST 1.1.
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[TipoMovimiento == income]", 600, 1580, -190, -700);

    // 1.2 El controlador valida rol (admin, encargado) y acceso a la sucursal
    addMessage(ctrlInventario, ctrlInventario,
        "1.2: income_route() · require_roles() + _require_branch_access()", false, step++);

    // 1.3 El controlador delega el registro en el servicio
    addMessage(ctrlInventario, svcInventario,
        "1.3: register_income()", false, step++);

    // 1.4 El servicio obtiene o crea la fila de stock de la variante en la sucursal
    addMessage(svcInventario, entInventario,
        "1.4: _get_or_create_inventory()", false, step++);

    // 1.5 Retorno de la fila de inventario
    addMessage(entInventario, svcInventario,
        "1.5: return()", true, step++);

    // 1.6 El servicio suma la cantidad recibida al stock
    addMessage(svcInventario, svcInventario,
        "1.6: inventory.quantity += payload.quantity", false, step++);

    // 1.7 El servicio crea y persiste el movimiento tipo income
    addMessage(svcInventario, entMovimiento,
        "1.7: InventoryMovement() · db.add(); db.commit()", false, step++);

    // 1.8 Retorno del movimiento registrado
    addMessage(entMovimiento, svcInventario,
        "1.8: return()", true, step++);

    // 1.9 Retorno del par (movement, inventory) hacia el controlador
    addMessage(svcInventario, ctrlInventario,
        "1.9: return()", true, step++);

    // 1.10 Respuesta HTTP 201 hacia la interfaz
    addMessage(ctrlInventario, uiMovimiento,
        "1.10: return 201 Created (movement.id, variant_id, branch_id, quantity)", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FRAGMENTO ALT: [TipoMovimiento == outcome]
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[TipoMovimiento == outcome]", 600, 1580, -740, -1440);

    // 1.11 El controlador valida rol (admin, encargado) y acceso a la sucursal
    addMessage(ctrlInventario, ctrlInventario,
        "1.11: outcome_route() · require_roles() + _require_branch_access()", false, step++);

    // 1.12 El controlador delega el registro en el servicio
    addMessage(ctrlInventario, svcInventario,
        "1.12: register_outcome()", false, step++);

    // 1.13 El servicio obtiene o crea la fila de stock
    addMessage(svcInventario, entInventario,
        "1.13: _get_or_create_inventory()", false, step++);

    // 1.14 Retorno de la fila de inventario
    addMessage(entInventario, svcInventario,
        "1.14: return()", true, step++);

    // 1.15 El servicio valida stock disponible suficiente
    addMessage(svcInventario, svcInventario,
        "1.15: _inventory_available() < quantity -> ValueError()", false, step++);

    // 1.16 El servicio descuenta la cantidad al stock
    addMessage(svcInventario, entInventario,
        "1.16: inventory.quantity -= payload.quantity", false, step++);

    // 1.17 El servicio crea y persiste el movimiento tipo outcome
    addMessage(svcInventario, entMovimiento,
        "1.17: InventoryMovement() · db.add(); db.commit()", false, step++);

    // 1.18 Retorno del movimiento registrado
    addMessage(entMovimiento, svcInventario,
        "1.18: return()", true, step++);

    // 1.19 Retorno del par (movement, inventory) hacia el controlador
    addMessage(svcInventario, ctrlInventario,
        "1.19: return()", true, step++);

    // 1.20 Respuesta HTTP 201 hacia la interfaz
    addMessage(ctrlInventario, uiMovimiento,
        "1.20: return 201 Created (movement.id, variant_id, branch_id, quantity)", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FRAGMENTO ALT: [TipoMovimiento == transfer]
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[TipoMovimiento == transfer]", 600, 1580, -1480, -2180);

    // 1.21 El controlador valida rol administrador y que origen/destino sean distintos
    addMessage(ctrlInventario, ctrlInventario,
        "1.21: transfer_route() · require_roles() + validación from != to", false, step++);

    // 1.22 El controlador delega el traspaso en el servicio
    addMessage(ctrlInventario, svcInventario,
        "1.22: register_transfer()", false, step++);

    // 1.23 El servicio obtiene o crea el inventario de la sucursal origen y valida stock
    addMessage(svcInventario, entInventario,
        "1.23: _get_or_create_inventory() · validar stock origen", false, step++);

    // 1.24 Retorno del inventario origen
    addMessage(entInventario, svcInventario,
        "1.24: return()", true, step++);

    // 1.25 El servicio obtiene o crea el inventario de la sucursal destino
    addMessage(svcInventario, entInventario,
        "1.25: _get_or_create_inventory() → quantity += quantity", false, step++);

    // 1.26 Retorno del inventario destino
    addMessage(entInventario, svcInventario,
        "1.26: return()", true, step++);

    // 1.27 El servicio crea y persiste los movimientos dobles transfer_out y transfer_in
    addMessage(svcInventario, entMovimiento,
        "1.27: InventoryMovement() · InventoryMovement() · db.add(); db.commit()", false, step++);

    // 1.28 Retorno de los movimientos creados
    addMessage(entMovimiento, svcInventario,
        "1.28: return()", true, step++);

    // 1.29 Retorno de los inventarios origen y destino al controlador
    addMessage(svcInventario, ctrlInventario,
        "1.29: return()", true, step++);

    // 1.30 Respuesta HTTP 201 hacia la interfaz
    addMessage(ctrlInventario, uiMovimiento,
        "1.30: return 201 Created (movements[], from_branch_id, to_branch_id)", true, step++);

    /* -------------------------------------------------------------------------
     * 6. FLUJO FINAL EN LA INTERFAZ (FUERA DEL ALT): refresco del listado
     * ------------------------------------------------------------------------- */

    // 1.31 La interfaz refresca el listado de movimientos
    addMessage(uiMovimiento, ctrlInventario,
        "1.31: GET /inventory/movements?branch_id=... (refresh lista)", false, step++);

    // 1.32 El controlador consulta los movimientos vía servicio
    addMessage(ctrlInventario, svcInventario,
        "1.32: list_movements()", false, step++);

    // 1.33 El servicio consulta la tabla de movimientos
    addMessage(svcInventario, entMovimiento,
        "1.33: query movimientos order by created_at desc", false, step++);

    // 1.34 Retorno de los registros
    addMessage(entMovimiento, svcInventario,
        "1.34: return()", true, step++);

    // 1.35 Retorno de la lista al controlador
    addMessage(svcInventario, ctrlInventario,
        "1.35: return()", true, step++);

    // 1.36 Retorno HTTP 200 hacia la interfaz
    addMessage(ctrlInventario, uiMovimiento,
        "1.36: return 200 OK (movements)", true, step++);

    // 1.37 La interfaz renderiza el listado actualizado al Encargado
    addMessage(uiMovimiento, actorEncargado,
        "1.37: mostrarMovimientosActualizados()", true, step++);

    /* -------------------------------------------------------------------------
     * 7. FLUJO DEL ACTOR CAJERO (FUERA DEL ALT): consulta de movimientos
     * ------------------------------------------------------------------------- */

    // 2. El Cajero consulta los movimientos de inventario
    addMessage(actorCajero, uiMovimiento,
        "2: consultarMovimientos()", false, step++);

    // 2.1 Solicitud GET HTTP al backend (permite roles admin, encargado y cajero)
    addMessage(uiMovimiento, ctrlInventario,
        "2.1: GET /inventory/movements (InventoryApiService.getMovements)", false, step++);

    // 2.2 El controlador delega el listado en el servicio
    addMessage(ctrlInventario, svcInventario,
        "2.2: movements_route · list_movements()", false, step++);

    // 2.3 El servicio consulta la tabla de movimientos con filtros
    addMessage(svcInventario, entMovimiento,
        "2.3: query movimientos con filtros (order by created_at desc)", false, step++);

    // 2.4 Retorno de los registros
    addMessage(entMovimiento, svcInventario,
        "2.4: return()", true, step++);

    // 2.5 Retorno de la lista al controlador
    addMessage(svcInventario, ctrlInventario,
        "2.5: return()", true, step++);

    // 2.6 Retorno HTTP 200 hacia la interfaz
    addMessage(ctrlInventario, uiMovimiento,
        "2.6: return 200 OK (movements)", true, step++);

    // 2.7 La interfaz renderiza el listado para el Cajero
    addMessage(uiMovimiento, actorCajero,
        "2.7: renderizarMovimientos()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU12 con orden cronológico y alts corregido generado con éxito!", 0);
}

main();