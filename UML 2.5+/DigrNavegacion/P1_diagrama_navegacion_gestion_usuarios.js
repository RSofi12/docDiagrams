/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * DIAGRAMA: Diagrama de Navegación del Paquete P1 - Gestión de Usuarios y Acceso
 * ESTÁNDAR: UML Web Modeling Framework (Conallen WAE) / Enterprise Architect
 * DESCRIPCIÓN: Flujo horizontal de navegación (5 columnas):
 *              Col 1: Entrada (LoginPage / RegisterPage «page»)
 *              Col 2: Hub Central (Dashboard «page»)
 *              Col 3: Páginas del Módulo P1 («page»)
 *              Col 4: Formularios y Vistas («form» / «view»)
 *              Col 5: Base de Datos (Database Connection Node)
 *
 * RELACIONES UML:
 *  - «link»: Navegación general entre páginas.
 *  - «submits»: Envío de datos desde formulario/pantalla.
 *  - «Access»: Acceso directo a vista o perfil.
 *  - «DB_access»: Acceso a persistencia de base de datos.
 *
 * CASOS DE USO DEL PAQUETE P1 (CU01-CU06):
 *  - CU01 Registrar cliente                       -> RegisterPage (register-page.component.ts)
 *  - CU02 Iniciar sesión (JWT por rol)            -> LoginPage (login-page.component.ts)
 *  - CU03 Gestionar usuarios internos             -> UsuariosAdminPage (admin-user-page.component.ts)
 *  - CU04 Gestionar sucursales                    -> SucursalesPage (admin-branch-page.component.ts)
 *  - CU05 Gestionar cuentas de proveedor          -> ProveedoresPage (admin-provider-page.component.ts)
 *  - CU06 Consultar y actualizar perfil           -> MiPerfilPage (profile-page.component.ts)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "Diagrama de Navegación P1 - Gestión de Usuarios y Acceso";

function log(msg) {
    Session.Output("[Navegacion-P1] " + msg);
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
    log("Iniciando generación del Diagrama de Navegación P1 con notación WAF / WMF (UML 2.5)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * COLUMNA 1: ENTRADA Y ACCESO (x: 40 a 190)
     * ------------------------------------------------------------------------- */
    var loginPage = addNavElement(pkg, diagram,
        "LoginPage\n(login-page.component.ts)\n[CU02]", "Artifact", "page", 40, 190, 80, 145);

    var registerPage = addNavElement(pkg, diagram,
        "RegisterPage\n(register-page.component.ts)\n[CU01]", "Artifact", "page", 40, 190, 220, 285);

    /* -------------------------------------------------------------------------
     * COLUMNA 2: HUB CENTRAL DE NAVEGACIÓN (x: 250 a 400)
     * ------------------------------------------------------------------------- */
    var dashboard = addNavElement(pkg, diagram,
        "Dashboard\n(app-shell.component.ts)", "Artifact", "page", 250, 400, 150, 215);

    /* -------------------------------------------------------------------------
     * COLUMNA 3: PÁGINAS DEL MÓDULO P1 (x: 460 a 610)
     * ------------------------------------------------------------------------- */
    var usersAdminPage = addNavElement(pkg, diagram,
        "UsuariosAdminPage\n(admin-user-page.component.ts)\n[CU03]", "Artifact", "page", 460, 610, 30, 95);

    var branchesPage = addNavElement(pkg, diagram,
        "SucursalesPage\n(admin-branch-page.component.ts)\n[CU04]", "Artifact", "page", 460, 610, 120, 185);

    var providersPage = addNavElement(pkg, diagram,
        "ProveedoresPage\n(admin-provider-page.component.ts)\n[CU05]", "Artifact", "page", 460, 610, 210, 275);

    var profilePage = addNavElement(pkg, diagram,
        "MiPerfilPage\n(profile-page.component.ts)\n[CU06]", "Artifact", "page", 460, 610, 300, 365);

    /* -------------------------------------------------------------------------
     * COLUMNA 4: FORMULARIOS Y VISTAS FUNCIONALES (x: 670 a 820)
     * ------------------------------------------------------------------------- */
    var loginForm = addNavElement(pkg, diagram,
        "LoginForm\n[CU02]", "Artifact", "form", 670, 820, 30, 95);

    var registerForm = addNavElement(pkg, diagram,
        "RegistroForm\n[CU01]", "Artifact", "form", 670, 820, 100, 165);

    var userForm = addNavElement(pkg, diagram,
        "UsuarioForm\n[CU03]", "Artifact", "form", 670, 820, 170, 235);

    var branchForm = addNavElement(pkg, diagram,
        "SucursalForm\n[CU04]", "Artifact", "form", 670, 820, 240, 305);

    var providerForm = addNavElement(pkg, diagram,
        "ProveedorForm\n[CU05]", "Artifact", "form", 670, 820, 310, 375);

    var profileView = addNavElement(pkg, diagram,
        "PerfilView\n[CU06]", "Artifact", "view", 670, 820, 380, 445);

    /* -------------------------------------------------------------------------
     * COLUMNA 5: BASE DE DATOS (x: 880 a 1030)
     * ------------------------------------------------------------------------- */
    var db = addNavElement(pkg, diagram,
        "Database Connection\n(FashionStore_DB)", "Node", "database", 880, 1030, 150, 330);

    /* -------------------------------------------------------------------------
     * RELACIONES Y FLUJO HORIZONTAL DE NAVEGACIÓN
     * ------------------------------------------------------------------------- */
    // Entrada -> Forms / Dashboard
    addNavLink(loginPage, loginForm, "submits", "Association");
    addNavLink(registerPage, registerForm, "submits", "Association");

    addNavLink(loginPage, dashboard, "link", "Dependency");
    addNavLink(registerPage, dashboard, "link", "Dependency");

    // Dashboard -> Páginas P1
    addNavLink(dashboard, usersAdminPage, "link", "Dependency");
    addNavLink(dashboard, branchesPage, "link", "Dependency");
    addNavLink(dashboard, providersPage, "link", "Dependency");
    addNavLink(dashboard, profilePage, "link", "Dependency");

    // Páginas -> Forms / Views
    addNavLink(usersAdminPage, userForm, "submits", "Association");
    addNavLink(branchesPage, branchForm, "submits", "Association");
    addNavLink(providersPage, providerForm, "submits", "Association");
    addNavLink(profilePage, profileView, "Access", "Dependency");

    // Forms / Views -> Database Connection (DB_access)
    addNavLink(loginForm, db, "DB_access", "Dependency");
    addNavLink(registerForm, db, "DB_access", "Dependency");
    addNavLink(userForm, db, "DB_access", "Dependency");
    addNavLink(branchForm, db, "DB_access", "Dependency");
    addNavLink(providerForm, db, "DB_access", "Dependency");
    addNavLink(profileView, db, "DB_access", "Dependency");

    /* Guardar y abrir diagrama */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado exitosamente con notación WAF horizontal.");
    Session.Prompt("¡Diagrama de Navegación P1 generado exitosamente!", 0);
}

main();