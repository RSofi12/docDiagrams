/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * DIAGRAMA: Diagrama de Navegación del Paquete P4 - Gestión de Compras y Reservas
 * ESTÁNDAR: UML Web Modeling Framework (Conallen WAE) / Enterprise Architect
 * DESCRIPCIÓN: Flujo horizontal de navegación (5 columnas):
 *              Col 1: Entrada (LoginPage «page»)
 *              Col 2: Hub Central (Dashboard «page»)
 *              Col 3: Páginas del Módulo P4 («page»)
 *              Col 4: Formularios y Vistas («form» / «view»)
 *              Col 5: Base de Datos (Database Connection Node)
 *
 * RELACIONES UML:
 *  - «link»: Navegación general entre páginas.
 *  - «submits»: Envío de datos desde formulario de reserva/checkout.
 *  - «Access»: Acceso a la vista del carrito de compras.
 *  - «DB_access»: Acceso a persistencia de base de datos.
 *
 * CASOS DE USO DEL PAQUETE P4 (CU14-CU16):
 *  - CU14 Gestionar reservas de prendas              -> ReservasPrendasPage (reservations-page.component.ts)
 *  - CU15 Gestionar carrito de compras                -> CarritoPage (cart-page.component.ts)
 *  - CU16 Realizar compra digital / checkout          -> CheckoutPedidoPage (orders-page.component.ts)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "Diagrama de Navegación P4 - Gestión de Compras y Reservas";

function log(msg) {
    Session.Output("[Navegacion-P4] " + msg);
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
 * Agrega un elemento genérico con dimensiones reducidas (150x65px), estereotipo y fuente a 12pt.
 */
function addNavElement(pkg, diagram, name, type, stereotype, l, r, t, b) {
    var el = pkg.Elements.AddNew(name, type);
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    el.Update();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = el.ElementID;
    try {
        dObj.Style = "FONT=Arial;FONTSIZE=12;";
    } catch (e) { }
    dObj.Update();
    return el;
}

/**
 * Agrega una dependencia estereotipada (src ..> dst) o una flecha directa (Association sólida).
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
    log("Iniciando generación del Diagrama de Navegación P4 con notación WAF / WMF (UML 2.5)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * COLUMNA 1: ENTRADA Y ACCESO (x: 40 a 190)
     * ------------------------------------------------------------------------- */
    var loginPage = addNavElement(pkg, diagram,
        "LoginPage\n(login-page.component.ts)\n[CU02]", "Artifact", "page", 40, 190, 150, 215);

    /* -------------------------------------------------------------------------
     * COLUMNA 2: HUB CENTRAL DE NAVEGACIÓN (x: 250 a 400)
     * ------------------------------------------------------------------------- */
    var dashboard = addNavElement(pkg, diagram,
        "Dashboard\n(app-shell.component.ts)", "Artifact", "page", 250, 400, 150, 215);

    /* -------------------------------------------------------------------------
     * COLUMNA 3: PÁGINAS DEL MÓDULO P4 (x: 460 a 610)
     * ------------------------------------------------------------------------- */
    var reservationsPage = addNavElement(pkg, diagram,
        "ReservasPrendasPage\n(reservations-page.component.ts)\n[CU14]", "Artifact", "page", 460, 610, 50, 115);

    var cartPage = addNavElement(pkg, diagram,
        "CarritoPage\n(cart-page.component.ts)\n[CU15]", "Artifact", "page", 460, 610, 150, 215);

    var checkoutPage = addNavElement(pkg, diagram,
        "CheckoutPedidoPage\n(orders-page.component.ts)\n[CU16]", "Artifact", "page", 460, 610, 250, 315);

    /* -------------------------------------------------------------------------
     * COLUMNA 4: FORMULARIOS Y VISTAS FUNCIONALES (x: 670 a 820)
     * ------------------------------------------------------------------------- */
    var reservationForm = addNavElement(pkg, diagram,
        "ReservaForm\n[CU14]", "Artifact", "form", 670, 820, 50, 115);

    var cartView = addNavElement(pkg, diagram,
        "CarritoView\n[CU15]", "Artifact", "view", 670, 820, 150, 215);

    var checkoutForm = addNavElement(pkg, diagram,
        "CheckoutForm\n[CU16]", "Artifact", "form", 670, 820, 250, 315);

    /* -------------------------------------------------------------------------
     * COLUMNA 5: BASE DE DATOS (x: 880 a 1030)
     * ------------------------------------------------------------------------- */
    var db = addNavElement(pkg, diagram,
        "Database Connection\n(FashionStore_DB)", "Node", "database", 880, 1030, 120, 300);

    /* -------------------------------------------------------------------------
     * RELACIONES Y FLUJO HORIZONTAL DE NAVEGACIÓN
     * ------------------------------------------------------------------------- */
    // Entrada -> Dashboard
    addNavLink(loginPage, dashboard, "link", "Dependency");

    // Dashboard -> Páginas P4
    addNavLink(dashboard, reservationsPage, "link", "Dependency");
    addNavLink(dashboard, cartPage, "link", "Dependency");
    addNavLink(dashboard, checkoutPage, "link", "Dependency");

    // Páginas -> Forms / Views
    addNavLink(reservationsPage, reservationForm, "submits", "Association");
    addNavLink(cartPage, cartView, "Access", "Dependency");
    addNavLink(checkoutPage, checkoutForm, "submits", "Association");

    // Forms / Views -> Database Connection (DB_access)
    addNavLink(reservationForm, db, "DB_access", "Dependency");
    addNavLink(cartView, db, "DB_access", "Dependency");
    addNavLink(checkoutForm, db, "DB_access", "Dependency");

    /* Guardar y abrir diagrama */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado exitosamente con notación WAF horizontal.");
    Session.Prompt("¡Diagrama de Navegación P4 generado exitosamente!", 0);
}

main();