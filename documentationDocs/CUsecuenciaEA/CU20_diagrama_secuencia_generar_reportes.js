/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU20 - Generar reportes y dashboards
 * DESCRIPCIÓN: El Administrador consulta el panel de indicadores (dashboard) y
 *              genera reportes de ventas, inventario y movimientos.
 * ACTOR: Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * REORDEN Y NORMAS (mismo formato que CU16):
 * - Sin fragmentos alt/opt en CU20: el actor correcto (Administrador) inicia el
 *   flujo directo y los reportes se generan sin verificación de rol en el diagrama
 *   (se omiten require_roles/verificarUsuarioAutenticado, igual que en CU23).
 * - Los mensajes usan las funciones reales del código:
 *   DashboardApiService.getDashboard (GET /dashboard),
 *   ReportsApiService.getSalesReport / getInventoryReport / getMovementsReport.
 * - Nombres de entidades = clases del código (inglés):
 *   :Sale, :Order, :Reservation, :Inventory, :InventoryMovement, :Product.
 * - El render posterior se crea justo después del último retorno de cada flujo.
 * - Nombres reales del frontend: :AdminHomePageComponent (Boundary) y el reporte
 *   reutiliza las pantallas de reportes (:SalesHistoryPageComponent /
 *   :AdminInventoryPageComponent) mediante :ReportController como Control.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU20 - Generar Reportes y Dashboards";

function log(msg) {
    Session.Output("[CU20-Secuencia] " + msg);
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-1800;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1700;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1700;", "");
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
            dObj.Bottom = -1800;
            dObj.Update();
            return;
        }
    }
}

function main() {
    log("Iniciando generación de CU20 con flujo actor-interface-controller-entities...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Administrador -> :AdminHomePageComponent (Boundary) -> :ReportController
     * -> :Sale, :Order, :Reservation, :Inventory, :InventoryMovement, :Product
     *    (Entidades: nombres de las clases del código)
     * (Sin :User ni fragmentos alt: el actor correcto inicia el flujo directo.)
     * ------------------------------------------------------------------------- */
    var actorAdmin   = addActorParticipant(pkg, diagram, "Administrador", 40, 100);
    var uiReportes   = addParticipant(pkg, diagram, ":AdminHomePageComponent", "Interface", 200, 260);
    var ctrlReporte  = addParticipant(pkg, diagram, ":ReportController", "Controller", 470, 220);

    var entSale       = addEntityParticipant(pkg, diagram, ":Sale",              730, 130);
    var entOrder      = addEntityParticipant(pkg, diagram, ":Order",             900, 140);
    var entReserva    = addEntityParticipant(pkg, diagram, ":Reservation",       1080, 160);
    var entInventory  = addEntityParticipant(pkg, diagram, ":Inventory",         1280, 160);
    var entMovement   = addEntityParticipant(pkg, diagram, ":InventoryMovement", 1480, 200);
    var entProduct    = addEntityParticipant(pkg, diagram, ":Product",           1720, 150);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: DASHBOARD (GET /dashboard)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiReportes,
        "1: consultarDashboard()", false, step++);

    addMessage(uiReportes, ctrlReporte,
        "1.1: GET /dashboard (DashboardApiService.getDashboard)", false, step++);

    addMessage(ctrlReporte, entSale,
        "1.2: consultarMetricasVentas()", false, step++);

    addMessage(entSale, ctrlReporte,
        "1.3: return(metricas_ventas)", true, step++);

    addMessage(ctrlReporte, entReserva,
        "1.4: consultarEstadoReservas()", false, step++);

    addMessage(entReserva, ctrlReporte,
        "1.5: return(conteo_estados)", true, step++);

    addMessage(ctrlReporte, entInventory,
        "1.6: consultarResumenStock()", false, step++);

    addMessage(entInventory, ctrlReporte,
        "1.7: return(resumen_stock)", true, step++);

    addMessage(ctrlReporte, entProduct,
        "1.8: consultarTopProductos()", false, step++);

    addMessage(entProduct, ctrlReporte,
        "1.9: return(top_productos)", true, step++);

    // Resumen de todos los KPI hacia la interface (cierre del flujo del panel)
    addMessage(ctrlReporte, uiReportes,
        "1.10: return 200 OK (DashboardResponse)", true, step++);

    addMessage(uiReportes, actorAdmin,
        "1.11: renderizarDashboard()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO 2: REPORTE DE VENTAS (GET /reports/sales)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiReportes,
        "2: generarReporteVentas()", false, step++);

    addMessage(uiReportes, ctrlReporte,
        "2.1: GET /reports/sales (ReportsApiService.getSalesReport)", false, step++);

    // get_sales_report une ventas presenciales (Sale/SaleItem) y pedidos en línea (Order/OrderItem)
    addMessage(ctrlReporte, entSale,
        "2.2: consultarVentasLocales()", false, step++);

    addMessage(entSale, ctrlReporte,
        "2.3: return(filas_ventas_locales)", true, step++);

    addMessage(ctrlReporte, entOrder,
        "2.4: consultarPedidosEnLinea()", false, step++);

    addMessage(entOrder, ctrlReporte,
        "2.5: return(filas_pedidos_en_linea)", true, step++);

    addMessage(ctrlReporte, uiReportes,
        "2.6: return 200 OK (SalesReport)", true, step++);

    addMessage(uiReportes, actorAdmin,
        "2.7: renderizarReporte()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FLUJO 3: REPORTE DE INVENTARIO (GET /reports/inventory)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiReportes,
        "3: generarReporteInventario()", false, step++);

    addMessage(uiReportes, ctrlReporte,
        "3.1: GET /reports/inventory (ReportsApiService.getInventoryReport)", false, step++);

    addMessage(ctrlReporte, entInventory,
        "3.2: consultarInventario()", false, step++);

    addMessage(entInventory, ctrlReporte,
        "3.3: return(stock_por_variante)", true, step++);

    addMessage(ctrlReporte, entProduct,
        "3.4: consultarDatosProductos()", false, step++);

    addMessage(entProduct, ctrlReporte,
        "3.5: return(nombres_variantes)", true, step++);

    addMessage(ctrlReporte, uiReportes,
        "3.6: return 200 OK (InventoryReport)", true, step++);

    addMessage(uiReportes, actorAdmin,
        "3.7: renderizarReporte()", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FLUJO 4: REPORTE DE MOVIMIENTOS (GET /reports/movements)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiReportes,
        "4: generarReporteMovimientos()", false, step++);

    addMessage(uiReportes, ctrlReporte,
        "4.1: GET /reports/movements (ReportsApiService.getMovementsReport)", false, step++);

    addMessage(ctrlReporte, entMovement,
        "4.2: consultarMovimientos()", false, step++);

    addMessage(entMovement, ctrlReporte,
        "4.3: return(flujo_movimientos)", true, step++);

    addMessage(ctrlReporte, uiReportes,
        "4.4: return 200 OK (MovementReport)", true, step++);

    // Render final: interface -> actor
    addMessage(uiReportes, actorAdmin,
        "4.5: renderizarReporte()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorAdmin);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU20 generado con éxito!", 0);
}

main();