/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU13 - Consultar inventario consolidado
 * DESCRIPCIÓN: Vista global de existencias de todas las sucursales.
 * ACTOR: Administrador
 * TIPO DE DIAGRAMA: Diagrama de Comunicación (UML 2.5+, íconos BCE activados
 *                   mediante ShowRobustness=1; Boundary, Control, Entity).
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * CONECTORES: Participantes unidos con Association normal (la misma que usa la
 * caja "Communication" de EA). Los mensajes se agregan SOBRE cada Association
 * mediante la colección Connector.Messages (equivalente a la opción contextual
 * "Add Message from <origen> to <destino>") con Name, SequenceNo y SequenceID.
 *
 * REGLAS APLICADAS (UML 2.5+):
 * - Distribución horizontal: Actor -> Pantalla (Boundary) -> Controlador
 *   (Control) -> Entidades (Entity/Model), tanto para componentes como mensajes.
 * - No se muestra el estereotipo textual: solo los nombres de los participantes.
 * - Íconos UML correspondientes a cada componente (boundary, control, entity).
 * - Los mensajes son funciones() reales del proyecto, SIN parámetros.
 * - Las ENTIDADES no envían mensajes de retorno al controlador.
 * - El CONTROLADOR no se envía mensajes recursivos a sí mismo.
 * - El CONTROLADOR puede enviar funciones() al boundary (entrega del resultado).
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU13 - Consultar Inventario Consolidado (Comunicacion)";

var msgCounter = 0;

function log(msg) {
    Session.Output("[CU13-Comunicacion] " + msg);
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
 * Recrea el diagrama de comunicación limpio (tipo "Communication" según las
 * cadenas reales de EA; verifica y registra el tipo final).
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

    var types = ["Communication", "Collaboration"];
    var diagram = null;
    for (var j = 0; j < types.length; j++) {
        try {
            diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, types[j]);
            diagram.Update();
            log("Tipo de diagrama creado: '" + diagram.Type + "'");
            if (diagram.Type == types[j]) {
                break;
            }
        } catch (e) {
            diagram = null;
        }
    }

    try {
        // ShowRobustness=1 activa los íconos Boundary / Control / Entity
        diagram.StyleEx = "ShowRobustness=1;";
    } catch (e) { }
    diagram.Update();
    pkg.Diagrams.Refresh();

    if (diagram.Type != "Communication" && diagram.Type != "Collaboration") {
        log("NOTA: el diagrama no es de tipo Communication/Collaboration (es '" +
            diagram.Type + "'); los mensajes solo se muestran en diagramas de comunicación.");
    }
    return diagram;
}

/**
 * Agrega un participante con su DiagramObject.
 * boundary = "boundary", controlador = "control", entidad = "entity".
 */
function addCommElement(pkg, diagram, name, type, stereotype, l, r, t, b) {
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
 * Busca la Association existente entre a y b (en cualquier dirección).
 */
function findLink(a, b) {
    for (var i = 0; i < a.Connectors.Count; i++) {
        var c = a.Connectors.GetAt(i);
        if ((c.SupplierID == b.ElementID && c.ClientID == a.ElementID) ||
            (c.SupplierID == a.ElementID && c.ClientID == b.ElementID)) {
            return c;
        }
    }
    return null;
}

/**
 * Agrega un mensaje sobre una Association, equivalente a la opción de EA
 * "Add Message from <origen> to <destino>". Si no existe la Association la crea.
 * seq = número de mensaje (ej. "1.2"); fn = nombre de la función sin parámetros.
 */
function addCommMessage(src, dst, seq, fn) {
    var con = findLink(src, dst);
    if (con == null) {
        con = src.Connectors.AddNew("", "Association");
        con.SupplierID = dst.ElementID;
        con.Update();
    }
    try {
        var msg = con.Messages.AddNew(fn, "");
        msg.Name = fn;
        msg.SequenceNo = seq;
        msg.SequenceID = ++msgCounter;
        msg.Update();
        con.Messages.Refresh();
        con.Update();
    } catch (e) {
        log("Aviso al agregar mensaje (" + seq + ": " + fn + "): " + e.message);
    }
    return con;
}

function main() {
    log("Iniciando generación del Diagrama de Comunicación de CU13...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES ("NAME ONLY", sin estereotipo textual):
     *    Actor -> Boundary -> Control -> 6 Entities
     * ------------------------------------------------------------------------- */
    var actorAdmin = addCommElement(pkg, diagram, "Administrador", "Actor", "", 40, 150, 190, 250);

    var uiInventario = addCommElement(pkg, diagram,
        ":AdminInventoryPageComponent", "Class", "boundary", 320, 520, 150, 220);

    var ctrlInventario = addCommElement(pkg, diagram,
        ":InventoryController", "Class", "control", 700, 900, 150, 220);

    var entInventario = addCommElement(pkg, diagram, ":Inventario", "Class", "entity", 1080, 1210, 120, 200);
    var entVariante    = addCommElement(pkg, diagram, ":Variante",    "Class", "entity", 1230, 1360, 120, 200);
    var entProducto    = addCommElement(pkg, diagram, ":Producto",    "Class", "entity", 1380, 1510, 120, 200);
    var entSucursal    = addCommElement(pkg, diagram, ":Sucursal",    "Class", "entity", 1530, 1660, 120, 200);
    var entTalla       = addCommElement(pkg, diagram, ":Talla",       "Class", "entity", 1680, 1810, 120, 200);
    var entColor       = addCommElement(pkg, diagram, ":Color",       "Class", "entity", 1830, 1960, 120, 200);

    /* -------------------------------------------------------------------------
     * 2. MENSAJES NUMERADOS (funciones reales, SIN parámetros)
     * ------------------------------------------------------------------------- */

    // 1. El Administrador inicia la consulta en la pantalla
    addCommMessage(actorAdmin, uiInventario, "1", "consultarInventarioConsolidado()");

    // 1.1 La pantalla delega al controlador
    addCommMessage(uiInventario, ctrlInventario, "1.1", "getConsolidatedStock()");

    // 1.2..1.7 El controlador consulta cada entidad (sin retorno explícito)
    addCommMessage(ctrlInventario, entInventario, "1.2", "obtenerExistenciasPorSucursal()");
    addCommMessage(ctrlInventario, entVariante,    "1.3", "obtenerDetalleVariantes()");
    addCommMessage(ctrlInventario, entProducto,    "1.4", "obtenerDatosProductos()");
    addCommMessage(ctrlInventario, entSucursal,    "1.5", "obtenerSucursales()");
    addCommMessage(ctrlInventario, entTalla,       "1.6", "obtenerTallas()");
    addCommMessage(ctrlInventario, entColor,       "1.7", "obtenerColores()");

    // 1.8 El controlador consolida y entrega el resultado a la pantalla
    addCommMessage(ctrlInventario, uiInventario, "1.8", "mostrarInventarioConsolidado()");

    // 1.9 La pantalla renderiza la tabla consolidada al Administrador
    addCommMessage(uiInventario, actorAdmin, "1.9", "renderizarInventarioConsolidado()");

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama de Comunicación CU13 generado con éxito!", 0);
}

main();