/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU23 - Generar reporte por voz/lenguaje natural
 * DESCRIPCIÓN: El Administrador dicta o escribe una instrucción en lenguaje natural.
 *              La IA Gemini interpreta el tipo de reporte, sucursal, fechas y columnas,
 *              y genera el reporte correspondiente.
 * ACTOR: Administrador
 * TIPO DE DIAGRAMA: Diagrama de Tiempo (UML 2.5 Timing Diagram)
 * ENTORNO: Enterprise Architect 15.0+ / 16.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUestado";
var DIAGRAM_NAME = "CU23 - Diagrama de Tiempo - Generar reporte por voz o lenguaje natural";

function log(msg) {
    Session.Output("[CU23-Tiempo] " + msg);
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

    var diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Timing");
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

function main() {
    log("Iniciando generación del Diagrama de Tiempo CU23 en Enterprise Architect...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // 1. Crear las dos líneas de vida (Lifelines de estado en paralelo) usando el tipo estándar "Lifeline"
    var elActor = pkg.Elements.AddNew("CU23 Acciones Administrador / UI", "Lifeline");
    elActor.Update();

    var elDB = pkg.Elements.AddNew("CU23 Servicio IA Gemini y Motor Reportes", "Lifeline");
    elDB.Update();

    // 2. Agregar elementos al diagrama con posiciones layout
    var dobj1 = diagram.DiagramObjects.AddNew("l=50;t=50;r=800;b=220;", "");
    dobj1.ElementID = elActor.ElementID;
    dobj1.Update();

    var dobj2 = diagram.DiagramObjects.AddNew("l=50;t=240;r=800;b=410;", "");
    dobj2.ElementID = elDB.ElementID;
    dobj2.Update();

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    Session.Prompt("¡Diagrama de Tiempo UML 2.5 de CU23 generado con éxito en Enterprise Architect!", 0);
}

main();
