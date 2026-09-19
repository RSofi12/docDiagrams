/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * DIAGRAMA: Diagrama de Navegación del Paquete P5 - Gestión de Ventas y Atención en Sucursal
 * DESCRIPCIÓN: Flujo horizontal de navegación y acceso a datos del paquete P5:
 *              Login -> Dashboard -> Pantallas del módulo -> Servicios -> BD.
 *              - Login -> Dashboard: flecha SÓLIDA (Association «submits»).
 *              - Dashboard -> Pantallas: dependencias «link».
 *              - Pantalla -> Servicio: dependencias «link».
 *              - Servicio -> Base de Datos (Node/Device): dependencias «DB_access».
 *              - sales-service -> inventory-service (CU18 «include» CU12).
 * ENTIDADES UML: Artifact (pantallas), Component (servicios funcionales), Node (database).
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * CASOS DE USO DEL PAQUETE P5 (CU17-CU18):
 *  - CU17 Atender reserva en sucursal (preparación y confirmación de llegada)
 *  - CU18 Registrar venta presencial y procesar pago en caja (comprobante; includes CU12)
 *
 * SERVICIOS FUNCIONALES (Component) del paquete P5:
 *  - reservation-service (CU17)
 *  - sales-service       (CU18)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "Diagrama de Navegación P5 - Gestión de Ventas y Atención en Sucursal";

function log(msg) {
    Session.Output("[Navegacion-P5] " + msg);
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
    log("Iniciando generación del Diagrama de Navegación P5 - Gestión de Ventas y Atención en Sucursal...");

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
     * 2. PANTALLAS DEL PAQUETE P5 (Artifact, columna central-izquierda)
     * ------------------------------------------------------------------------- */
    var attendReservation = addNavElement(pkg, diagram,
        "AtenderReserva\n<<artifact>>\n(attend-reservation-page)", "Artifact", "", 420, 570, 60, 130);

    var posSale = addNavElement(pkg, diagram,
        "VentaEnCaja\n<<artifact>>\n(pos-sale-page)", "Artifact", "", 420, 570, 210, 280);

    /* -------------------------------------------------------------------------
     * 3. SERVICIOS FUNCIONALES DEL PAQUETE P5 (Component)
     * ------------------------------------------------------------------------- */
    var reservationService = addNavElement(pkg, diagram,
        "reservation-service\n<<component>>\n", "Component", "component", 640, 790, 80, 150);

    var salesService = addNavElement(pkg, diagram,
        "sales-service\n<<component>>\n", "Component", "component", 640, 790, 230, 300);

    var inventoryService = addNavElement(pkg, diagram,
        "inventory-service\n<<component>>\n", "Component", "component", 640, 790, 390, 460);

    /* -------------------------------------------------------------------------
     * 4. BASE DE DATOS (NODE/DEVICE)
     * ------------------------------------------------------------------------- */
    var db = addNavElement(pkg, diagram,
        "PostgreSQL Database\nFashionStore_DB", "Node", "database", 860, 1010, 100, 320);

    /* -------------------------------------------------------------------------
     * 5. FLUJO HORIZONTAL DE NAVEGACIÓN Y ACCESO A DATOS
     * ------------------------------------------------------------------------- */
    addNavLink(login, dashboard, "submits", "Association");

    addNavLink(dashboard, attendReservation, "link", "Dependency");
    addNavLink(dashboard, posSale, "link", "Dependency");

    addNavLink(attendReservation, reservationService, "link", "Dependency");
    addNavLink(posSale, salesService, "link", "Dependency");

    addNavLink(reservationService, db, "DB_access", "Dependency");
    addNavLink(salesService, db, "DB_access", "Dependency");

    /* CU18 «include» CU12: toda venta presencial actualiza el inventario de la sucursal */
    addNavLink(salesService, inventoryService, "include", "Dependency");

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama de Navegación P5 - Gestión de Ventas y Atención en Sucursal generado con éxito!", 0);
}

main();