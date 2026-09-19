/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * DIAGRAMA: Diagrama de Navegación General del Sistema
 * DESCRIPCIÓN: Flujo general de navegación y acceso a datos del proyecto:
 *              Login -> Dashboard -> 6 Components (módulos) -> Base de Datos.
 *              - Login -> Dashboard: flecha SÓLIDA directa (Association «submits»).
 *              - Dashboard -> Components: dependencias «link».
 *              - Components -> Base de Datos (Node/Device): dependencias «DB_access».
 * ENTIDADES UML: Artifact (login/dashboard), Component (6 módulos), Node (database).
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * COMPONENTES (nombre camelCase como si ya estuvieran implementados):
 *  - pkgUsuariosYAcceso            (P1: Gestión de usuarios y acceso | CU01-CU06)
 *  - pkgProductosYCatalogo         (P2: Gestión de productos y catálogo | CU07-CU10)
 *  - pkgInventarioYDisponibilidad  (P3: Gestión de inventario y disponibilidad | CU11-CU13)
 *  - pkgComprasYReservas           (P4: Gestión de compras y reservas | CU14-CU16)
 *  - pkgVentasYAtSucursal          (P5: Gestión de ventas y atención en sucursal | CU17-CU18)
 *  - pkgExperienciaYAnalitica      (P6: Experiencia inteligente y analítica | CU19-CU23)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "Diagrama de Navegación General - FashionStore";

function log(msg) {
    Session.Output("[Navegacion-General] " + msg);
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
    log("Iniciando generación del Diagrama de Navegación General...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. ARTEFACTOS DE INTERFAZ DE NAVEGACIÓN
     * ------------------------------------------------------------------------- */
    var login = addNavElement(pkg, diagram,
        "Login\n<<artifact>>\n(login-page.component)", "Artifact", "", 50, 250, 30, 110);

    var dashboard = addNavElement(pkg, diagram,
        "Dashboard\n<<artifact>>\n(app-shell.component)", "Artifact", "", 400, 700, 30, 110);

    /* -------------------------------------------------------------------------
     * 2. BASE DE DATOS (NODE/DEVICE: cubo de dispositivo)
     * ------------------------------------------------------------------------- */
    var db = addNavElement(pkg, diagram,
        "PostgreSQL Database\nFashionStore_DB", "Node", "database", 1250, 1600, 420, 520);

    /* -------------------------------------------------------------------------
     * 3. ORGANIZACIÓN EN LOS 6 COMPONENTES DEL SISTEMA
     * ------------------------------------------------------------------------- */
    var compUsers = addNavElement(pkg, diagram,
        "pkgUsuariosYAcceso", "Component", "component", 50, 350, 320, 520);

    var compCatalog = addNavElement(pkg, diagram,
        "pkgProductosYCatalogo", "Component", "component", 450, 750, 320, 520);

    var compInventory = addNavElement(pkg, diagram,
        "pkgInventarioYDisponibilidad", "Component", "component", 850, 1150, 320, 520);

    var compOrders = addNavElement(pkg, diagram,
        "pkgComprasYReservas", "Component", "component", 50, 350, 620, 820);

    var compPos = addNavElement(pkg, diagram,
        "pkgVentasYAtSucursal", "Component", "component", 450, 750, 620, 820);

    var compAR = addNavElement(pkg, diagram,
        "pkgExperienciaYAnalitica", "Component", "component", 850, 1150, 620, 820);

    /* -------------------------------------------------------------------------
     * 4. FLUJO DE NAVEGACIÓN Y ACCESO A DATOS
     * Login -> Dashboard (flecha SOLIDAS directa); Dashboard -> Components;
     * Components -> Base de Datos.
     * ------------------------------------------------------------------------- */
    addNavLink(login, dashboard, "submits", "Association");

    addNavLink(dashboard, compUsers, "link", "Dependency");
    addNavLink(dashboard, compCatalog, "link", "Dependency");
    addNavLink(dashboard, compInventory, "link", "Dependency");
    addNavLink(dashboard, compOrders, "link", "Dependency");
    addNavLink(dashboard, compPos, "link", "Dependency");
    addNavLink(dashboard, compAR, "link", "Dependency");

    addNavLink(compUsers, db, "DB_access", "Dependency");
    addNavLink(compCatalog, db, "DB_access", "Dependency");
    addNavLink(compInventory, db, "DB_access", "Dependency");
    addNavLink(compOrders, db, "DB_access", "Dependency");
    addNavLink(compPos, db, "DB_access", "Dependency");
    addNavLink(compAR, db, "DB_access", "Dependency");

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama de Navegación General de FashionStore generado con éxito!", 0);
}

main();