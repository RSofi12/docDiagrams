/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU18 - Registrar venta presencial y procesar pago en caja
 * DESCRIPCIÓN: Registro de venta física (con o sin reserva previa), cobro y emisión
 *              de comprobante.
 * ACTOR: Cajero
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * IMPLEMENTACIÓN REFERENCIADA (frontend/backend):
 * - frontend: features/cajero/pages/sales-page.component.ts (SalesPageComponent) y
 *   services/sales-api.service.ts (createSale, searchReservation).
 * - backend routes/sales_routes.py -> create_sale_route, _resolve_branch_id, require_roles.
 * - backend services/sales_service.py -> create_sale, _resolve_items, _create_sale_from_items,
 *   _get_inventory_for_update, _get_reservation_for_branch, _serialize_sale, _sale_items_query.
 * - models (nombres reales): Sale, SaleItem, Reservation, Inventory, ProductVariant,
 *   InventoryMovement, Branch.
 *
 * FLUJO BCE estrictamente secuencial (sin saltos):
 * Actor -> Interface -> Controller -> Entities -> Controller -> Interface -> Actor.
 * No hay capa Service: las operaciones del servicio se muestran como responsabilidad
 * del Controlador (mensajes self sobre :SalesController).
 *
 * CONVENCIONES:
 * - Funciones sin parámetros: solo el nombre con "()".
 * - El diagrama SIEMPRE cierra con un mensaje final hacia el actor (render del
 *   comprobante en la interfaz; convención de la capa UI, no función del backend).
 * - Entidades en RECUADROS RECTANGULARES con cabecera <<Entity>> y :Nombre mediante
 *   addEntityParticipant (Entity\u00A0).
 * - Los fragmentos combinados (alt/loop) inician en la columna de la INTERFAZ (left=200).
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU18 - Registrar Venta Presencial";

function log(msg) {
    Session.Output("[CU18-Secuencia] " + msg);
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
    log("Iniciando generación de CU18 (BCE sin Service, fragmentos desde la interfaz)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE (Todos en RECUADROS RECTANGULARES)
     * Actor -> Boundary -> Controller -> Entities  (SIN capa Service)
     * ------------------------------------------------------------------------- */
    var bottom = -2300;

    var actorCajero = addActorParticipant(pkg, diagram, "Cajero", 25, 85, bottom);

    var uiVenta = addParticipant(pkg, diagram, ":SalesPageComponent", "Interface", 200, 230, bottom);
    var ctrlVenta = addParticipant(pkg, diagram, ":SalesController", "Controller", 520, 200, bottom);

    // 7 Entidades en recuadros rectangulares con cabecera <<Entity>>
    var entSale = addEntityParticipant(pkg, diagram, ":Sale", 810, 110, bottom);
    var entItem = addEntityParticipant(pkg, diagram, ":SaleItem", 1010, 110, bottom);
    var entReserva = addEntityParticipant(pkg, diagram, ":Reservation", 1210, 120, bottom);
    var entInventario = addEntityParticipant(pkg, diagram, ":Inventory", 1420, 110, bottom);
    var entVariante = addEntityParticipant(pkg, diagram, ":ProductVariant", 1620, 130, bottom);
    var entMovimiento = addEntityParticipant(pkg, diagram, ":InventoryMovement", 1840, 150, bottom);
    var entSucursal = addEntityParticipant(pkg, diagram, ":Branch", 2080, 100, bottom);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO INICIAL: FUERA DEL ALT
     * ------------------------------------------------------------------------- */

    // 1. El Cajero registra una venta presencial
    addMessage(actorCajero, uiVenta,
        "1: registrarVenta()", false, step++);

    // 1.1 El Cajero selecciona el método de cobro (cash | stripe) y arma el payload
    addMessage(uiVenta, uiVenta,
        "1.1: seleccionar método de cobro (cash | stripe) · armar payload", false, step++);

    // 1.2 Solicitud POST HTTP al backend
    addMessage(uiVenta, ctrlVenta,
        "1.2: POST /sales (SalesApiService.createSale)", false, step++);

    // 1.3 El controlador valida rol (admin, encargado, cajero) y resuelve la sucursal
    addMessage(ctrlVenta, ctrlVenta,
        "1.3: create_sale_route() · require_roles() + _resolve_branch_id()", false, step++);

    // 1.4 El controlador procesa la venta (create_sale) y la agrega a la sesión
    addMessage(ctrlVenta, ctrlVenta,
        "1.4: create_sale() · db.add(sale)", false, step++);

    /* =====================================================================
     * INICIO FRAGMENTO 1: alt [venta con reserva previa]  (mensajes 1.5 a 1.7)
     * Rama alternativa: la venta proviene de una reserva confirmada.
     * ===================================================================== */
    addCombinedFragment(pkg, diagram, "alt", "[venta con reserva previa]", 200, 1330, -270, -500);

    // 1.5 El controlador bloquea y carga la reserva de la sucursal
    addMessage(ctrlVenta, entReserva,
        "1.5: _get_reservation_for_branch() · with_for_update", false, step++);

    // 1.6 Retorno de la reserva
    addMessage(entReserva, ctrlVenta,
        "1.6: return(reserva)", true, step++);

    // 1.7 El controlador agrupa las variantes desde los items de la reserva
    addMessage(ctrlVenta, ctrlVenta,
        "1.7: _resolve_items() · agrupar items de reservation.items", false, step++);

    /* =====================================================================
     * FIN FRAGMENTO 1: alt [venta con reserva previa]
     * ===================================================================== */

    /* =====================================================================
     * INICIO FRAGMENTO 2: alt [venta sin reserva (items manuales)]  (mensajes 1.8 a 1.11)
     * Rama alternativa: venta directa con items cargados manualmente.
     * ===================================================================== */
    addCombinedFragment(pkg, diagram, "alt", "[venta sin reserva (items manuales)]", 200, 940, -540, -690);

    // 1.8 El controlador agrupa las variantes desde el payload
    addMessage(ctrlVenta, ctrlVenta,
        "1.8: _resolve_items() · agrupar items de payload.items", false, step++);

    // 1.9 El controlador valida que la venta tenga items
    addMessage(ctrlVenta, ctrlVenta,
        "1.9: validar venta sin items -> ValueError()", false, step++);

    // 1.10 El controlador crea y persiste la venta (status completed, pago paid)
    addMessage(ctrlVenta, entSale,
        "1.10: Sale() · status=completed, payment_status=paid · db.add(); db.flush()", false, step++);

    // 1.11 Retorno del id de la venta
    addMessage(entSale, ctrlVenta,
        "1.11: return(sale_id)", true, step++);

    /* =====================================================================
     * FIN FRAGMENTO 2: alt [venta sin reserva (items manuales)]
     * ===================================================================== */

    /* =====================================================================
     * INICIO FRAGMENTO 3: loop [por cada variante en la venta]  (mensajes 1.12 a 1.18)
     * Repetición para cada variante: inventario, variante, stock, item y movimiento.
     * ===================================================================== */
    addCombinedFragment(pkg, diagram, "loop", "[por cada variante en la venta]", 200, 1990, -850, -1350);

    // 1.12 El controlador bloquea y carga el inventario de la variante
    addMessage(ctrlVenta, entInventario,
        "1.12: _get_inventory_for_update() · SELECT ... FOR UPDATE", false, step++);

    // 1.13 Retorno del inventario
    addMessage(entInventario, ctrlVenta,
        "1.13: return(inventory)", true, step++);

    // 1.14 El controlador valida la variante (status activo) y consulta su precio
    addMessage(ctrlVenta, entVariante,
        "1.14: query ProductVariant · validar status activo + precio", false, step++);

    // 1.15 Retorno de la variante
    addMessage(entVariante, ctrlVenta,
        "1.15: return(variant)", true, step++);

    // 1.16 El controlador descuenta la cantidad del stock
    addMessage(ctrlVenta, entInventario,
        "1.16: inventory.quantity -= quantity", false, step++);

    // 1.17 El controlador crea y persiste el detalle de venta
    addMessage(ctrlVenta, entItem,
        "1.17: SaleItem() · db.add()", false, step++);

    // 1.18 El controlador crea el movimiento de inventario tipo outcome
    addMessage(ctrlVenta, entMovimiento,
        "1.18: InventoryMovement() · tipo outcome, nota venta · db.add()", false, step++);

    /* =====================================================================
     * FIN FRAGMENTO 3: loop [por cada variante en la venta]
     * ===================================================================== */

    /* -------------------------------------------------------------------------
     * 6. FLUJO FINAL (FUERA DEL LOOP): cierre, serialización y comprobante
     * ------------------------------------------------------------------------- */

    // 1.19 [si con reserva] El controlador marca la reserva como atendida
    addMessage(ctrlVenta, entReserva,
        "1.19: [si con reserva] reservation.status = attended", false, step++);

    // 1.20 El controlador calcula totales y persiste la venta
    addMessage(ctrlVenta, entSale,
        "1.20: sale.subtotal/total · db.commit(); db.refresh(sale)", false, step++);

    // 1.21 El controlador serializa la venta consultando sus items
    addMessage(ctrlVenta, entItem,
        "1.21: _serialize_sale() → _sale_items_query()", false, step++);

    // 1.22 Retorno de los items serializados
    addMessage(entItem, ctrlVenta,
        "1.22: return(items)", true, step++);

    // 1.23 El controlador consulta el nombre de la sucursal
    addMessage(ctrlVenta, entSucursal,
        "1.23: query Branch.name", false, step++);

    // 1.24 Retorno del nombre de la sucursal
    addMessage(entSucursal, ctrlVenta,
        "1.24: return(branch_name)", true, step++);

    // 1.25 Respuesta HTTP 201 hacia la interfaz
    addMessage(ctrlVenta, uiVenta,
        "1.25: return 201 Created (venta registrada)", true, step++);

    // 1.26 La interfaz emite el comprobante para el Cajero
    addMessage(uiVenta, actorCajero,
        "1.26: mostrarComprobante()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU18 con BCE sin Service y fragmentos desde la interfaz!", 0);
}

main();