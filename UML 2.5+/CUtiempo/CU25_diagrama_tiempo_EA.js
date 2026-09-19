/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU25 - Gestionar códigos promocionales
 * DESCRIPCIÓN: El Administrador o Encargado crea y gestiona códigos promocionales
 *              con reglas de alcance (global vs sucursal), vigencia y tipo de descuento.
 * ACTOR: Administrador / Encargado de sucursal
 * TIPO DE DIAGRAMA: Diagrama de Tiempo (UML 2.5 Timing Diagram)
 * ENTORNO: Enterprise Architect 15.0+ / 16.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUtiempo";
var DIAGRAM_NAME = "CU25 - Diagrama de Tiempo - Gestionar codigos promocionales";

function log(msg) {
    Session.Output("[CU25-Tiempo] " + msg);
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

/**
 * Crea una lifeline de un Diagrama de Tiempo UML 2.5.
 * El tipo de elemento correcto en EA para lifelines de timing es "TimeLine"
 * (único tipo válido de Elements.AddNew que aplica a diagramas de tiempo;
 * "StateLifeline"/"ValueLifeline" son solo etiquetas del Toolbox, no tipos).
 * Se intenta "TimeLine" primero y se degrada a tipos básicos UML.
 */
function createTimelineElement(pkg, name, typesToTry) {
    typesToTry = typesToTry || ["TimeLine", "Object", "State"];
    for (var i = 0; i < typesToTry.length; i++) {
        try {
            var el = pkg.Elements.AddNew(name, typesToTry[i]);
            if (el != null) {
                el.Update();
                log("Línea de tiempo '" + name + "' creada con tipo EA: " + typesToTry[i]);
                return el;
            }
        } catch (e) {
            log("Tipo '" + typesToTry[i] + "' rechazado (" + e.message + "); probando siguiente.");
        }
    }
    Session.Prompt("No se pudo crear el elemento con los tipos probados.", 0);
    return null;
}

/**
 * Puebla una lifeline de tiempo con sus estados y tiempos (eje X = tiempo).
 *
 * IMPORTANTE: la colección el.StateTransitions del Element es de SOLO LECTURA
 * (Object Model: "List of State Transitions ... Read only"), por lo que NO
 * admite AddNew. La colección escribible es el.Transitions ("The Transitions
 * collection applies only to Timeline elements"), cuyos elementos exponen
 * TxState (estado al que transiciona) y TxTime (instante de la transición).
 *
 * @param el          elemento TimeLine
 * @param transitions array de { time: Number, state: String }
 */
function populateTimeline(el, transitions) {
    if (el == null || transitions == null || transitions.length == 0) return;
    var ok = 0;
    for (var i = 0; i < transitions.length; i++) {
        var t = transitions[i];
        var tr = null;
        try { tr = el.Transitions.AddNew(t.state, t.state); } catch (e0) { tr = null; }
        if (tr == null) {
            try { tr = el.Transitions.AddNew(t.state, "" + t.time); } catch (e1) { tr = null; }
        }
        if (tr == null) {
            try { tr = el.Transitions.AddNew("", ""); } catch (e2) { tr = null; }
        }
        if (tr == null) {
            log("Transición t=" + t.time + " ('" + t.state + "') no se pudo crear.");
            continue;
        }
        try { tr.TxState = t.state; } catch (e3) { }
        try { tr.TxTime = "" + t.time; } catch (e4) { }
        try { tr.Update(); } catch (e5) { }
        ok++;
    }
    try { el.Update(); } catch (e6) { }
    log("Timeline '" + el.Name + "': " + ok + " estados/transiciones cargados.");
}

function main() {
    log("Iniciando generación del Diagrama de Tiempo UML 2.5 CU25 en Enterprise Architect...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // 1. Lifelines del timing diagram: Estado (actor) y Valor (servicio/BD)
    //    Ambos usan el tipo EA "TimeLine"; la distinción State/Value Lifeline
    //    se aplica por estilo del elemento, no por tipo de AddNew.
    var elActor = createTimelineElement(pkg, "CU25 Administrador / Encargado",
        ["TimeLine", "Object", "State"]);
    var elDB = createTimelineElement(pkg, "CU25 Servicio Promociones y Base de Datos",
        ["TimeLine", "Object", "State"]);
    if (elActor == null || elDB == null) return;

    // 2. Estados y tiempos de cada lifeline, replicando el .puml
    //    (t=0, 5, 15, 25, 35, 45, 55, 65).
    populateTimeline(elActor, [
        { time: 0,  state: "Descanso" },
        { time: 5,  state: "SolicitarGestionPromociones" },
        { time: 15, state: "ConsultarListaCupones" },
        { time: 25, state: "IngresarDatosNuevoCupon" },
        { time: 35, state: "ConfirmarCreacionCupon" },
        { time: 45, state: "VisualizarCuponActivo" },
        { time: 55, state: "PromocionListaParaCanjeEnCarrito" },
        { time: 65, state: "Descanso" }
    ]);

    populateTimeline(elDB, [
        { time: 0,  state: "SinOperacion" },
        { time: 5,  state: "CargandoCuponesPorSucursal" },
        { time: 15, state: "ListaCuponesDesplegada" },
        { time: 25, state: "ValidandoCodigoUnicoYAlcanceRol" },
        { time: 35, state: "PersistiendoPromotionCodeEnDB" },
        { time: 45, state: "CuponCreadoYVigente" },
        { time: 55, state: "DisponibleParaCU15Carrito" },
        { time: 65, state: "Descanso" }
    ]);

    // 3. Agregar los objetos al diagrama con layout paralelo (misma escala X)
    var dobj1 = diagram.DiagramObjects.AddNew("l=50;t=50;r=800;b=220;", "");
    dobj1.ElementID = elActor.ElementID;
    dobj1.Update();

    var dobj2 = diagram.DiagramObjects.AddNew("l=50;t=260;r=800;b=430;", "");
    dobj2.ElementID = elDB.ElementID;
    dobj2.Update();

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    Session.Prompt("¡Diagrama de Tiempo UML 2.5 de CU25 generado con éxito en Enterprise Architect!", 0);
}

main();