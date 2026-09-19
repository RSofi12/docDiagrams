/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * DIAGRAMA: Diagrama de Navegación del Paquete P6 - Experiencia Inteligente y Analítica
 * DESCRIPCIÓN: Flujo horizontal de navegación y acceso a datos del paquete P6:
 *              Login -> Dashboard -> Pantallas del módulo -> Servicios -> BD.
 *              - Login -> Dashboard: flecha SÓLIDA (Association «submits»).
 *              - Dashboard -> Pantallas: dependencias «link».
 *              - Pantalla -> Servicio: dependencias «link».
 *              - Servicio -> Base de Datos (Node/Device): dependencias «DB_access».
 * ENTIDADES UML: Artifact (pantallas), Component (servicios funcionales), Node (database).
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * CASOS DE USO DEL PAQUETE P6 (CU19-CU23):
 *  - CU19 Usar vestidor virtual          -> VestidorVirtual (fitting-room-page)
 *  - CU20 Generar reportes y dashboards  -> ReportesAdmin (reports-page)
 *  - CU21 Recibir recomendaciones de IA  -> RecomendacionesIA (recommendations-page)
 *  - CU22 Consultar asistente virtual    -> AsistenteChatbot (chatbot-widget)
 *  - CU23 Reporte por voz/idioma natural -> ReporteVoz (voice-report-page)
 *
 * SERVICIOS FUNCIONALES (Component) del paquete P6:
 *  - fitting-service, reports-service, recommendations-service,
 *    chatbot-service, voice-report-service
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "Diagrama de Navegación P6 - Experiencia Inteligente y Analítica";

function log(msg) {
    Session.Output("[Navegacion-P6] " + msg);
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

    var diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Navigation");
    try {
        diagram.StyleEx = "ShowRobustness=0;SequenceCustomArt=0;";
    } catch (e) { }
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

/**
 * Agrega un elemento genérico con su DiagramObject y estereotipo opcional.
 * Cajas de tamaño reducido para flujo horizontal.
 */
function addNavElement(pkg, diagram, name, type, stereotype, l, r, t, b) {
    var el = pkg.Elements.AddNew(name, type);
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    el.Update();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

/**
 * Agrega una dependencia estereotipada (src ..> dst) o una flecha directa
 * (Association sólida, con dirección src -> dst) según 'type'.
 */
function addNavLink(src, dst, stereotype, type) {
    var con = src.Connectors.AddNew("", type || "Dependency");
    con.SupplierID = dst.ElementID;
    if (stereotype && stereotype.length > 0) {
        con.Stereotype = stereotype;
    }
    con.Update();
    if (type == "Association") {
        try {
            con.Direction = "Source -> Destination";
            con.Update();
        } catch (e) { }
    }
    return con;
}

function main() {
    log("Iniciando generación del Diagrama de Navegación P6 - Experiencia Inteligente y Analítica...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. ARTEFACTOS DE NAVEGACIÓN (Login -> Dashboard)
     * ------------------------------------------------------------------------- */
    var login = addNavElement(pkg, diagram,
        "Login\n<<artifact>>\n(login-page.component)", "Artifact", "", 20, 170, 180, 250);

    var dashboard = addNavElement(pkg, diagram,
        "Dashboard\n<<artifact>>\n(app-shell.component)", "Artifact", "", 220, 370, 180, 250);

    /* -------------------------------------------------------------------------
     * 2. PANTALLAS DEL PAQUETE P6 (Artifact, columna central-izquierda)
     * ------------------------------------------------------------------------- */
    var virtualFitting = addNavElement(pkg, diagram,
        "VestidorVirtual\n<<artifact>>\n(fitting-room-page)", "Artifact", "", 420, 570, 20, 90);

    var adminReports = addNavElement(pkg, diagram,
        "ReportesAdmin\n<<artifact>>\n(reports-page)", "Artifact", "", 420, 570, 120, 190);

    var recommendations = addNavElement(pkg, diagram,
        "RecomendacionesIA\n<<artifact>>\n(recommendations-page)", "Artifact", "", 420, 570, 220, 290);

    var chatbot = addNavElement(pkg, diagram,
        "AsistenteChatbot\n<<artifact>>\n(chatbot-widget)", "Artifact", "", 420, 570, 320, 390);

    var voiceReport = addNavElement(pkg, diagram,
        "ReporteVoz\n<<artifact>>\n(voice-report-page)", "Artifact", "", 420, 570, 420, 490);

    /* -------------------------------------------------------------------------
     * 3. SERVICIOS FUNCIONALES DEL PAQUETE P6 (Component)
     * ------------------------------------------------------------------------- */
    var fittingService = addNavElement(pkg, diagram,
        "fitting-service\n<<component>>", "Component", "component", 640, 790, 30, 100);

    var reportsService = addNavElement(pkg, diagram,
        "reports-service\n<<component>>", "Component", "component", 640, 790, 120, 190);

    var recommendationsService = addNavElement(pkg, diagram,
        "recommendations-service\n<<component>>", "Component", "component", 640, 790, 210, 280);

    var chatbotService = addNavElement(pkg, diagram,
        "chatbot-service\n<<component>>", "Component", "component", 640, 790, 300, 370);

    var voiceReportService = addNavElement(pkg, diagram,
        "voice-report-service\n<<component>>", "Component", "component", 640, 790, 390, 460);

    /* -------------------------------------------------------------------------
     * 4. BASE DE DATOS (NODE/DEVICE)
     * ------------------------------------------------------------------------- */
    var db = addNavElement(pkg, diagram,
        "PostgreSQL Database\nFashionStore_DB", "Node", "database", 860, 1010, 80, 460);

    /* -------------------------------------------------------------------------
     * 5. FLUJO HORIZONTAL DE NAVEGACIÓN Y ACCESO A DATOS
     * ------------------------------------------------------------------------- */
    addNavLink(login, dashboard, "submits", "Association");

    addNavLink(dashboard, virtualFitting, "link", "Dependency");
    addNavLink(dashboard, adminReports, "link", "Dependency");
    addNavLink(dashboard, recommendations, "link", "Dependency");
    addNavLink(dashboard, chatbot, "link", "Dependency");
    addNavLink(dashboard, voiceReport, "link", "Dependency");

    addNavLink(virtualFitting, fittingService, "link", "Dependency");
    addNavLink(adminReports, reportsService, "link", "Dependency");
    addNavLink(recommendations, recommendationsService, "link", "Dependency");
    addNavLink(chatbot, chatbotService, "link", "Dependency");
    addNavLink(voiceReport, voiceReportService, "link", "Dependency");

    addNavLink(fittingService, db, "DB_access", "Dependency");
    addNavLink(reportsService, db, "DB_access", "Dependency");
    addNavLink(recommendationsService, db, "DB_access", "Dependency");
    addNavLink(chatbotService, db, "DB_access", "Dependency");
    addNavLink(voiceReportService, db, "DB_access", "Dependency");

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama de Navegación P6 - Experiencia Inteligente y Analítica generado con éxito!", 0);
}

main();