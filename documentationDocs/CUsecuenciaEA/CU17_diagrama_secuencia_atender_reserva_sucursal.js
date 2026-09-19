/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU17 - Atender reserva en sucursal
 * DESCRIPCIÓN: Preparación de prendas reservadas y confirmación de la llegada del cliente
 *              en la sucursal, con liberación del stock reservado al entregar.
 * ACTOR: Encargado de sucursal
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NOTA DE SECUENCIA (mismo criterio que CU13):
 * - Los fragmentos 'alt' y 'loop' se declaran y crean en el código DESPUÉS de la solicitud
 *   HTTP que delimitan, para respetar el orden cronológico de renderizado.
 * - Alt de autenticación: top = -190 (holgura tras el texto de GET 1.1) y left = 520
 *   (comenzando en el controlador).
 * - Opt de llegada del cliente y opt de cancelación: recuadros propios con guarda,
 *   declarados después de su solicitud HTTP, en bandas sin solaparse.
 * - Alt de atención de reserva: banda inferior sin solaparse con los anteriores.
 * - loop [por cada item reservado] anidado dentro del alt de atención por coordenadas.
 * - Entidades en RECUADROS RECTANGULARES con cabecera <<Entity>> y :Nombre mediante
 *   addEntityParticipant (Entity\u00A0).
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU17 - Atender Reserva en Sucursal";

function log(msg) {
    Session.Output("[CU17-Secuencia] " + msg);
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-2200;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2200;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2200;", "");
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
 * Agrega fragmentos combinados (alt, loop, opt).
 */
function addCombinedFragment(pkg, diagram, type, guardLabel, left, right, top, bottom) {
    try {
        var frag = pkg.Elements.AddNew(guardLabel, "InteractionFragment");
        frag.Stereotype = type; // "alt", "loop" u "opt"
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
    log("Iniciando generación de CU17 con orden cronológico de fragmentos (mismo criterio que CU13)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE (Todos en RECUADROS RECTANGULARES)
     * Actor -> Boundary -> Controller -> Entities
     * ------------------------------------------------------------------------- */
    var actorEncargado = addActorParticipant(pkg, diagram, "Encargado de sucursal", 40, 100);
    var uiReservas     = addParticipant(pkg, diagram, ":ReservationsPageComponent", "Interface",   200, 260);
    var ctrlReservas   = addParticipant(pkg, diagram, ":ReservationController",    "Controller",  520, 230);

    // 5 Entidades en recuadros rectangulares con cabecera <<Entity>>
    var entReserva     = addEntityParticipant(pkg, diagram, ":Reserva",            810, 150);
    var entItem        = addEntityParticipant(pkg, diagram, ":ItemReserva",       1020, 170);
    var entVariante    = addEntityParticipant(pkg, diagram, ":Variante",          1250, 140);
    var entInventario  = addEntityParticipant(pkg, diagram, ":Inventario",        1450, 150);
    var entSucursal    = addEntityParticipant(pkg, diagram, ":Sucursal",          1660, 150);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: CONSULTAR RESERVAS PENDIENTES DE LA SUCURSAL (GET /reservations/branch)
     * ------------------------------------------------------------------------- */

    // 1. El Encargado ingresa a la vista de reservas de la sucursal
    addMessage(actorEncargado, uiReservas,
        "1: consultarReservasSucursal()", false, step++);

    // 1.1 Solicitud GET HTTP al backend (FUERA Y ANTES DEL ALT)
    addMessage(uiReservas, ctrlReservas,
        "1.1: GET /reservations/branch (ReservationApiService.listByBranch)", false, step++);

    /* -------------------------------------------------------------------------
     * 3. FRAGMENTO ALT DE AUTENTICACIÓN (DECLARADO DESPUÉS DEL GET 1.1)
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[Autenticación y Rol == encargado/administrador]", 520, 1820, -190, -620);

    // 1.2 El controlador verifica la sucursal del encargado y sus permisos
    addMessage(ctrlReservas, entSucursal,
        "1.2: verificarPermisosSucursal(branch_id)", false, step++);

    // 1.3 Retorno de sucursal autorizada
    addMessage(entSucursal, ctrlReservas,
        "1.3: return(sucursal_autorizada)", true, step++);

    // 1.4 El controlador consulta las reservas de la sucursal
    addMessage(ctrlReservas, entReserva,
        "1.4: consultarReservasPorSucursal()", false, step++);

    // 1.5 Retorno de la lista de reservas
    addMessage(entReserva, ctrlReservas,
        "1.5: return(lista_reservas)", true, step++);

    // 1.6 El controlador consulta el detalle de los items con variante y producto
    addMessage(ctrlReservas, entItem,
        "1.6: consultarDetalleItemsReserva()", false, step++);

    // 1.7 Retorno de items con detalle (SKU, talla, color, precio)
    addMessage(entItem, ctrlReservas,
        "1.7: return(items_con_detalle)", true, step++);

    // 1.8 Retorno HTTP 200 con las reservas de la sucursal hacia la interfaz
    addMessage(ctrlReservas, uiReservas,
        "1.8: return 200 OK (reservas_sucursal)", true, step++);

    // 1.9 La interfaz renderiza la lista de reservas para el Encargado
    addMessage(uiReservas, actorEncargado,
        "1.9: renderizarListaReservas()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FRAGMENTO OPT: CONFIRMAR LLEGADA DEL CLIENTE (PATCH /reservations/{id}/arrival)
     * Declarado cronológicamente después del PATCH 2.1, con su propio recuadro.
     * ------------------------------------------------------------------------- */
    addMessage(actorEncargado, uiReservas,
        "2: confirmarLlegadaCliente(reserva_id)", false, step++);

    // 2.1 Solicitud PATCH HTTP de llegada al backend (FUERA DEL OPT)
    addMessage(uiReservas, ctrlReservas,
        "2.1: PATCH /reservations/{id}/arrival (ReservationApiService.confirmArrival)", false, step++);

    addCombinedFragment(pkg, diagram, "opt", "[cliente llega a la sucursal]", 520, 1820, -640, -900);

    // 2.2 El controlador verifica que la reserva sea confirmable
    addMessage(ctrlReservas, entReserva,
        "2.2: verificarEstadoReserva()", false, step++);

    // 2.3 Retorno de reserva confirmable
    addMessage(entReserva, ctrlReservas,
        "2.3: return(reserva_confirmable)", true, step++);

    // 2.4 El controlador confirma la llegada del cliente
    addMessage(ctrlReservas, entReserva,
        "2.4: confirmarLlegada()", false, step++);

    // 2.5 Retorno de reserva confirmada
    addMessage(entReserva, ctrlReservas,
        "2.5: return(reserva_confirmada)", true, step++);

    // 2.6 Retorno HTTP 200 con la reserva actualizada
    addMessage(ctrlReservas, uiReservas,
        "2.6: return 200 OK (reserva_actualizada)", true, step++);

    // 2.7 La interfaz actualiza la vista de reservas
    addMessage(uiReservas, actorEncargado,
        "2.7: actualizarVistaReservas()", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FRAGMENTO ALT DE ATENCIÓN: BANDA INFERIOR SIN SOLAPARSE CON EL PRIMER ALT
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[Reserva pendiente o confirmada (atendible)]", 520, 1820, -920, -1500);

    // 3. El Encargado atiende la reserva (preparación y entrega de prendas)
    addMessage(actorEncargado, uiReservas,
        "3: atenderReserva(reserva_id)", false, step++);

    // 3.1 Solicitud PATCH HTTP de atención al backend
    addMessage(uiReservas, ctrlReservas,
        "3.1: PATCH /reservations/{id}/attend (ReservationApiService.attendReservation)", false, step++);

    // 3.2 El controlador verifica que la reserva pueda atenderse
    addMessage(ctrlReservas, entReserva,
        "3.2: verificarEstadoReserva()", false, step++);

    // 3.3 Retorno de reserva atendible
    addMessage(entReserva, ctrlReservas,
        "3.3: return(reserva_atendible)", true, step++);

    /* -------------------------------------------------------------------------
     * 6. FRAGMENTO LOOP: ANIDADO DENTRO DEL ALT DE ATENCIÓN POR COORDENADAS
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "loop", "[por cada item reservado]", 520, 740, -1060, -1170);

    // loop [por cada item reservado]
    // 3.4 El controlador obtiene el item reservado
    addMessage(ctrlReservas, entItem,
        "3.4: obtenerItemReserva()", false, step++);

    // 3.5 Retorno del item reservado
    addMessage(entItem, ctrlReservas,
        "3.5: return(item_reservado)", true, step++);

    // 3.6 El controlador descuenta cantidad del inventario (físico y reservado)
    addMessage(ctrlReservas, entInventario,
        "3.6: descontarStockReservado(variante_id)", false, step++);

    // 3.7 Retorno del stock actualizado
    addMessage(entInventario, ctrlReservas,
        "3.7: return(stock_actualizado)", true, step++);

    // 3.8 El controlador cambia el estado de la reserva a atendida
    addMessage(ctrlReservas, entReserva,
        "3.8: cambiarEstadoReserva(atendida)", false, step++);

    // 3.9 Retorno de reserva atendida
    addMessage(entReserva, ctrlReservas,
        "3.9: return(reserva_atendida)", true, step++);

    // 3.10 Retorno HTTP 200 con la reserva actualizada hacia la interfaz
    addMessage(ctrlReservas, uiReservas,
        "3.10: return 200 OK (reserva_actualizada)", true, step++);

    // 3.11 La interfaz muestra la confirmación de la atención al Encargado
    addMessage(uiReservas, actorEncargado,
        "3.11: mostrarConfirmacionAtencion()", true, step++);

/* -------------------------------------------------------------------------
     * 7. FLUJO 4: CANCELAR RESERVA POR LA SUCURSAL (PATCH /reservations/{id}/branch-cancel)
     * Declarado cronológicamente después del PATCH 4.1, con su propio recuadro opt.
     * ------------------------------------------------------------------------- */
    addMessage(actorEncargado, uiReservas,
        "4: cancelarReservaSucursal(reserva_id)", false, step++);

    // 4.1 Solicitud PATCH HTTP de cancelación al backend (FUERA DEL OPT)
    addMessage(uiReservas, ctrlReservas,
        "4.1: PATCH /reservations/{id}/branch-cancel (ReservationApiService.cancelBranch)", false, step++);

    addCombinedFragment(pkg, diagram, "opt", "[cancelar reserva en sucursal]", 520, 1820, -1520, -1860);

    // 4.2 El controlador verifica que la reserva sea cancelable
    addMessage(ctrlReservas, entReserva,
        "4.2: verificarEstadoReserva()", false, step++);

    // 4.3 Retorno de estado cancelable
    addMessage(entReserva, ctrlReservas,
        "4.3: return(estado_cancelable)", true, step++);

    // 4.4 El controlador libera el stock previamente reservado
    addMessage(ctrlReservas, entInventario,
        "4.4: liberarStockReservado(variante_id)", false, step++);

    // 4.5 Retorno del stock liberado
    addMessage(entInventario, ctrlReservas,
        "4.5: return(stock_liberado)", true, step++);

    // 4.6 El controlador cambia el estado de la reserva a cancelado
    addMessage(ctrlReservas, entReserva,
        "4.6: cambiarEstadoReserva(cancelada)", false, step++);

    // 4.7 Retorno de reserva cancelada
    addMessage(entReserva, ctrlReservas,
        "4.7: return(reserva_cancelada)", true, step++);

    // 4.8 Retorno HTTP 200 con la reserva actualizada
    addMessage(ctrlReservas, uiReservas,
        "4.8: return 200 OK (reserva_actualizada)", true, step++);

    // 4.9 La interfaz actualiza la vista de reservas
    addMessage(uiReservas, actorEncargado,
        "4.9: actualizarVistaReservas()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU17 con fragmentos alt/loop y flujos opt generado con éxito!", 0);
}

main();