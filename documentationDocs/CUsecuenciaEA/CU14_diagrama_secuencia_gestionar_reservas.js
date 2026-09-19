/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU14 - Gestionar reservas de prendas
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NOTA CRÍTICA DE ESTABILIDAD EN ENTERPRISE ARCHITECT 15:
 * En EA 15, la creación de elementos 'InteractionFragment' (alt, loop, opt) mediante API
 * genera una excepción de memoria en el motor gráfico (Access Violation GDI+) al intentar
 * abrir el diagrama, provocando el cierre abrupto del programa.
 *
 * SOLUCIÓN:
 * 1. Se eliminan los InteractionFragment generados por código que corrompen el renderizado.
 * 2. Las decisiones e iteraciones (loop, alt, opt) se indican limpiamente en los mensajes
 *    de secuencia (notación estándar UML académica).
 * 3. Se elimina cualquier diagrama anterior defectuoso para que EA vuelva a abrir el diagrama
 *    de forma instantánea y 100% estable sin cerrarse.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU14 - Gestionar Reservas de Prendas";

function log(msg) {
    Session.Output("[CU14-Secuencia] " + msg);
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
 * Recrea el diagrama eliminando cualquier versión anterior que haya quedado corrupta.
 */
function recreateDiagram(pkg) {
    for (var i = 0; i < pkg.Diagrams.Count; i++) {
        var d = pkg.Diagrams.GetAt(i);
        if (d.Name == DIAGRAM_NAME) {
            pkg.Diagrams.RemoveAt(i);
            pkg.Diagrams.Refresh();
            log("Diagrama previo eliminado para regeneración limpia y estable.");
            break;
        }
    }

    var diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Sequence");
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

/**
 * Agrega el Actor con su ícono estándar UML (muñeco) y nombre centrado.
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
 * Agrega mensaje de secuencia. isReturn = true genera la flecha discontinua de retorno.
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

function main() {
    log("Iniciando generación estable de diagrama de secuencia BCE para CU14...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Actor -> Pantalla -> Controlador -> Entidades
     * ------------------------------------------------------------------------- */
    var actorCliente  = addActorParticipant(pkg, diagram, "Cliente",               40,   90);
    var uiReservas    = addParticipant(pkg, diagram, ":UI_GestionReservas",        "Interface",  220, 180);
    var ctrlReservas  = addParticipant(pkg, diagram, ":Ctrl_GestionReservas",      "Controller", 470, 190);
    var entSucursal   = addParticipant(pkg, diagram, ":Sucursal",                  "Entity",     720, 130);
    var entVariante   = addParticipant(pkg, diagram, ":Variante",                  "Entity",     900, 130);
    var entInventario = addParticipant(pkg, diagram, ":Inventario",                "Entity",     1080, 140);
    var entReserva    = addParticipant(pkg, diagram, ":Reserva",                   "Entity",     1270, 140);

    /* -------------------------------------------------------------------------
     * 2. FLUJO DE MENSAJES NUMERADOS (Flujo 1: Crear Reserva | Flujo 2: Cancelar Reserva)
     * ------------------------------------------------------------------------- */
    var step = 1;

    // ==========================================
    // FLUJO 1: CREACIÓN DE LA RESERVA
    // ==========================================

    // 1. Cliente selecciona prendas, sucursal y horario
    addMessage(actorCliente, uiReservas,
        "1: solicitarReserva()", false, step++);

    // 1.1 Solicitud desde la interfaz al controlador
    addMessage(uiReservas, ctrlReservas,
        "1.1: createReservation()", false, step++);

    // 1.2 Validación de sucursal activa
    addMessage(ctrlReservas, entSucursal,
        "1.2: verificarSucursalActiva()", false, step++);

    // 1.3 Retorno de sucursal válida
    addMessage(entSucursal, ctrlReservas,
        "1.3: return(sucursal_valida)", true, step++);

    // 1.4 loop [por cada prenda]: validar estado activo de la variante
    addMessage(ctrlReservas, entVariante,
        "1.4: loop [por cada prenda] validarDisponibilidadPrenda()", false, step++);

    // 1.5 Retorno de prenda disponible
    addMessage(entVariante, ctrlReservas,
        "1.5: return(variante_activa)", true, step++);

    // 1.6 Consulta de stock en inventario
    addMessage(ctrlReservas, entInventario,
        "1.6: verificarStockDisponible()", false, step++);

    // 1.7 Retorno de stock disponible
    addMessage(entInventario, ctrlReservas,
        "1.7: return(stock_disponible)", true, step++);

    // 1.8 alt [stock suficiente]: bloquear cantidad en inventario
    addMessage(ctrlReservas, entInventario,
        "1.8: alt [stock suficiente] bloquearStockReserva()", false, step++);

    // 1.9 Retorno de stock bloqueado
    addMessage(entInventario, ctrlReservas,
        "1.9: return(stock_bloqueado)", true, step++);

    // 1.10 Registro de la entidad Reserva
    addMessage(ctrlReservas, entReserva,
        "1.10: registrarReserva()", false, step++);

    // 1.11 Retorno de reserva creada
    addMessage(entReserva, ctrlReservas,
        "1.11: return(reserva_creada)", true, step++);

    // 1.12 Retorno de confirmación hacia la interfaz
    addMessage(ctrlReservas, uiReservas,
        "1.12: return(reserva_confirmada)", true, step++);

    // 1.13 Notificación de éxito al cliente
    addMessage(uiReservas, actorCliente,
        "1.13: mostrarConfirmacionReserva()", true, step++);

    // ==========================================
    // FLUJO 2: CANCELACIÓN DE LA RESERVA (opt)
    // ==========================================

    // 2. opt [cliente cancela reserva]: solicitud de cancelación
    addMessage(actorCliente, uiReservas,
        "2: opt [cancelar reserva] solicitarCancelacion()", false, step++);

    // 2.1 Solicitud hacia el controlador
    addMessage(uiReservas, ctrlReservas,
        "2.1: cancelReservation()", false, step++);

    // 2.2 Verificación de estado cancelable
    addMessage(ctrlReservas, entReserva,
        "2.2: verificarEstadoReserva()", false, step++);

    // 2.3 Retorno de estado válido
    addMessage(entReserva, ctrlReservas,
        "2.3: return(estado_cancelable)", true, step++);

    // 2.4 Liberación del stock reservado en inventario
    addMessage(ctrlReservas, entInventario,
        "2.4: liberarStockReservado()", false, step++);

    // 2.5 Retorno de inventario restablecido
    addMessage(entInventario, ctrlReservas,
        "2.5: return(stock_liberado)", true, step++);

    // 2.6 Cambio de estado de la reserva
    addMessage(ctrlReservas, entReserva,
        "2.6: cambiarEstadoCancelado()", false, step++);

    // 2.7 Retorno de confirmación de cancelación
    addMessage(entReserva, ctrlReservas,
        "2.7: return(reserva_cancelada)", true, step++);

    // 2.8 Retorno hacia la pantalla
    addMessage(ctrlReservas, uiReservas,
        "2.8: return(cancelacion_exitosa)", true, step++);

    // 2.9 Notificación al cliente
    addMessage(uiReservas, actorCliente,
        "2.9: notificarReservaCancelada()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente sin errores.");
    Session.Prompt("¡Diagrama CU14 generado con éxito! Abre de forma inmediata y estable.", 0);
}

main();
