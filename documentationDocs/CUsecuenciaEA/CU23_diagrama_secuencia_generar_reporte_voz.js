/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU23 - Generar reporte por voz
 * DESCRIPCIÓN: El Administrador dicta una solicitud de reporte por voz (Web Speech
 *              es-BO); el frontend envía la transcripción a POST /reports/query,
 *              Gemini interpreta el report_type/filtros y el backend ejecuta el
 *              reporte de ventas, inventario o movimientos.
 * ACTOR: Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * REORDEN Y NORMAS (mismo formato que CU16):
 * - Los fragmentos alt/opt empiezan DESDE LA INTERFACE (left = 200) y se
 *   declaran en el código en orden cronológico, después de su solicitud HTTP.
 *   Cada fragmento documenta su ALCANCE (mensaje inicial..mensaje final).
 * - ALCANCE DE LOS ALT (de qué mensaje a qué mensaje va cada fragmento):
 *   ALT "report_type no válido o IA no disponible": mensajes 1.6..1.7.
 *   ALT "report_type == ventas": mensajes 1.8..1.13.
 *   ALT "report_type == inventario": mensajes 1.14..1.17.
 *   ALT "report_type == movimientos": mensajes 1.18..1.21.
 * - La verificación de rol (require_roles) se OMITE a propósito: se sobreentiende
 *   que el actor correcto inicia el flujo del caso de uso directo.
 * - Los mensajes usan las funciones reales del código:
 *   startListening() / queryNaturalLanguage (ReportsApiService),
 *   generate_natural_report, _interpret_sync (Gemini),
 *   get_sales_report, get_inventory_report y get_movements_report.
 * - Nombres reales del frontend: :SalesHistoryPageComponent / :AdminInventoryPageComponent
 *   (el reconocimiento de voz es shared); se representa un único Boundary para
 *   la pantalla de reportes. :NaturalReportController como Control y :Gemini
 *   (IA externa) como entidad externa.
 * - Nombres de entidades = clases del código (inglés):
 *   :Gemini (IA), :Sale, :Order, :Inventory, :InventoryMovement.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU23 - Generar Reporte por Voz";

function log(msg) {
    Session.Output("[CU23-Secuencia] " + msg);
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-2000;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1900;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1900;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

/**
 * Agrega mensaje de secuencia. isReturn = true crea la flecha discontinua de retorno.
 * Si src === dst se crea la flecha recursiva de validación sobre la misma línea de vida.
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
 * Agrega fragmentos combinados (alt, loop, opt) que EMPIEZAN de la interface.
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

/**
 * Re-fija los bounds del DiagramObject del actor DESPUÉS de crear todos los
 * mensajes para que su lifeline llegue hasta el último render (interface -> actor).
 */
function stretchActorLifeline(diagram, actorEl) {
    for (var i = 0; i < diagram.DiagramObjects.Count; i++) {
        var dObj = diagram.DiagramObjects.GetAt(i);
        if (dObj.ElementID == actorEl.ElementID) {
            dObj.Top = -20;
            dObj.Bottom = -2000;
            dObj.Update();
            return;
        }
    }
}

function main() {
    log("Iniciando generación de CU23 con flujo actor-interface-controller-entities...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Administrador -> :SalesHistoryPageComponent (Boundary) -> :NaturalReportController
     * -> :Gemini (IA), :Sale, :Order, :Inventory,
     *    :InventoryMovement (Entidades: nombres de las clases del código)
     * (La entidad :User no participa: se omite la verificación de rol porque el
     * actor correcto inicia el flujo del caso de uso directo.)
     * ------------------------------------------------------------------------- */
    var actorAdmin  = addActorParticipant(pkg, diagram, "Administrador", 40, 100);
    var uiVozReporte = addParticipant(pkg, diagram, ":SalesHistoryPageComponent", "Interface", 200, 260);
    var ctrlNat     = addParticipant(pkg, diagram, ":NaturalReportController", "Controller", 520, 240);

    var entIA         = addEntityParticipant(pkg, diagram, ":Gemini",                810, 140);
    var entSale       = addEntityParticipant(pkg, diagram, ":Sale",                  990, 130);
    var entOrder      = addEntityParticipant(pkg, diagram, ":Order",                1160, 140);
    var entInventory  = addEntityParticipant(pkg, diagram, ":Inventory",            1340, 150);
    var entMovement   = addEntityParticipant(pkg, diagram, ":InventoryMovement",    1530, 200);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: DICTADO POR VOZ (Web Speech es-BO) -> POST /reports/query
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiVozReporte,
        "1: iniciarReporteVoz()", false, step++);

    // El navegador transcribe el audio (Web Speech API); mensaje recursivo en la interface
    addMessage(uiVozReporte, uiVozReporte,
        "1.1: startListening() [Web Speech es-BO]", false, step++);

    addMessage(uiVozReporte, uiVozReporte,
        "1.2: return(transcripcion_detectada)", true, step++);

    addMessage(uiVozReporte, ctrlNat,
        "1.3: POST /reports/query (ReportsApiService.queryNaturalLanguage)", false, step++);

    // generate_natural_report: Gemini interpreta report_type, formato y filtros
    addMessage(ctrlNat, entIA,
        "1.4: _interpret_sync(prompt) [generate_natural_report]", false, step++);

    addMessage(entIA, ctrlNat,
        "1.5: return(report_type, format, filtros)", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FRAGMENTO ALT: CONSULTA INVÁLIDA O GEMINI NO DISPONIBLE
     * (empieza después del HTTP; empieza desde la interface)
     * ALCANCE: mensajes 1.6..1.7
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[report_type no válido o IA no disponible]", 200, 760, -420, -560);

    addMessage(ctrlNat, uiVozReporte,
        "1.6: return 4xx/5xx (NaturalReportError)", true, step++);

    addMessage(uiVozReporte, actorAdmin,
        "1.7: mostrarErrorVoz()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FRAGMENTO ALT: REPORTE DE VENTAS (report_type == sales)
     * ALCANCE: mensajes 1.8..1.13
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[report_type == ventas]", 200, 1300, -600, -1020);

    addMessage(ctrlNat, entSale,
        "1.8: get_sales_report() [ventas locales]", false, step++);

    addMessage(entSale, ctrlNat,
        "1.9: return(filas_ventas)", true, step++);

    addMessage(ctrlNat, entOrder,
        "1.10: get_sales_report() [pedidos en línea]", false, step++);

    addMessage(entOrder, ctrlNat,
        "1.11: return(filas_pedidos)", true, step++);

    addMessage(ctrlNat, uiVozReporte,
        "1.12: return 200 OK (reporte_ventas)", true, step++);

    addMessage(uiVozReporte, actorAdmin,
        "1.13: renderizarReporteVoz()", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FRAGMENTO ALT: REPORTE DE INVENTARIO (report_type == inventory)
     * ALCANCE: mensajes 1.14..1.17
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[report_type == inventario]", 200, 1490, -1060, -1340);

    addMessage(ctrlNat, entInventory,
        "1.14: get_inventory_report()", false, step++);

    addMessage(entInventory, ctrlNat,
        "1.15: return(stock_por_variante)", true, step++);

    addMessage(ctrlNat, uiVozReporte,
        "1.16: return 200 OK (reporte_inventario)", true, step++);

    addMessage(uiVozReporte, actorAdmin,
        "1.17: renderizarReporteVoz()", true, step++);

    /* -------------------------------------------------------------------------
     * 6. FRAGMENTO ALT: REPORTE DE MOVIMIENTOS (report_type == movements)
     * ALCANCE: mensajes 1.18..1.21
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[report_type == movimientos]", 200, 1730, -1380, -1660);

    addMessage(ctrlNat, entMovement,
        "1.18: get_movements_report()", false, step++);

    addMessage(entMovement, ctrlNat,
        "1.19: return(flujo_movimientos)", true, step++);

    addMessage(ctrlNat, uiVozReporte,
        "1.20: return 200 OK (reporte_movimientos)", true, step++);

    addMessage(uiVozReporte, actorAdmin,
        "1.21: renderizarReporteVoz()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorAdmin);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU23 generado con éxito!", 0);
}

main();