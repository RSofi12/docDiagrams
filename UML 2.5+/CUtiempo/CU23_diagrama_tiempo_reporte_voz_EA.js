/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU23 - Generar reporte por voz/lenguaje natural
 * DESCRIPCIÓN: Diagrama de Tiempo conceptual (UML 2.5) para Enterprise Architect.
 * ENTORNO: Enterprise Architect 15.0+ / 16.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU23 - Diagrama de Tiempo - Generar reporte por voz o lenguaje natural";

function log(msg) {
    Session.Output("[CU23-Tiempo] " + msg);
}

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

function createTimingElement(pkg, name) {
    var typesToTry = ["TimeLine", "Object", "State", "Sequence"];
    for (var i = 0; i < typesToTry.length; i++) {
        try {
            var el = pkg.Elements.AddNew(name, typesToTry[i]);
            if (el != null) {
                el.Update();
                log("Línea de tiempo '" + name + "' creada con tipo EA: " + typesToTry[i]);
                return el;
            }
        } catch (e) {
            // Intenta el siguiente tipo válido de EA
        }
    }
    Session.Prompt("No se pudo crear el elemento con los tipos probados.", 0);
    return null;
}

function main() {
    log("Iniciando generación del Diagrama de Tiempo CU23 en Enterprise Architect...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // Crear la línea de tiempo conceptual única para el Caso de Uso (sin actores)
    var elCU = createTimingElement(pkg, "CU23");
    if (elCU == null) return;

    // Agregar el objeto de la línea de tiempo al diagrama
    var dobj = diagram.DiagramObjects.AddNew("l=50;t=50;r=850;b=350;", "");
    dobj.ElementID = elCU.ElementID;
    dobj.Update();

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    Session.Prompt("¡Diagrama de Tiempo conceptual de CU23 generado con éxito en Enterprise Architect!", 0);
}

main();
