/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU25 - Gestionar códigos promocionales
 * DESCRIPCIÓN: Creación y consulta de códigos de descuento (cupones) con tipo de
 * descuento, valor, vigencia y alcance (global o de una sucursal específica).
 * ACTORES: Encargado Sucursal / Administrador (flujo idéntico; divergen en alcance)
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ORDEN DE LOS FLUJOS (según guías UML):
 *   1) FLUJO 1 - Consulta: flujo lineal completo, sin fragmentos.
 *   2) FLUJO 2 - Creación: flujo PRINCIPAL (happy path) completo primero
 *      (Actor -> Interface -> Controller -> Entities -> Controller -> Interface -> Actor).
 *   3) FLUJO 3 - Alternativas y errores al FINAL, en fragmentos autocontenidos:
 *      alt [alcance del código según rol], alt [validación de datos del payload],
 *      opt [código duplicado (IntegrityError)]. Así no se interrumpe el flujo BCE
 *      principal y no se perciben saltos de lifeline entre ramas.
 *
 * FRAGMENTOS COMBINADOS (delimitados con comentarios INICIO/FIN):
 *   B) alt [alcance del código según rol]          -> mensajes 2.12 a 2.15
 *   C) alt [validación de datos del payload]       -> mensajes 2.16 a 2.18
 *   D) opt [código duplicado (IntegrityError)]     -> mensajes 2.19 a 2.21
 *
 * Nombres de componentes y funciones reales del código (sin parámetros):
 * - Frontend: PromotionsPageComponent.load/create/validarFormulario, PromotionApiService.list/create.
 * - Backend: promotion_routes.py (get_promotion_codes, create_promotion_code),
 *   promotion_service.py (list_codes, create_code), schemas (validate_discount),
 *   models PromotionCode/User/Branch.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU25 - Gestionar Códigos Promocionales";

function log(msg) {
    Session.Output("[CU25-Secuencia] " + msg);
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-1200;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1200;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1200;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

/**
 * Agrega mensaje de secuencia. isReturn = true crea la flecha discontinua de retorno.
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
 * Agrega fragmentos combinados (alt, opt).
 */
function addCombinedFragment(pkg, diagram, type, guardLabel, left, right, top, bottom) {
    try {
        var frag = pkg.Elements.AddNew(guardLabel, "InteractionFragment");
        frag.Stereotype = type; // "alt", "opt" o "loop"
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

function main() {
    log("Iniciando generación de CU25 con consulta, creación y errores al final...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE (sin Service)
     * Actor -> Boundaries -> Controllers -> Entities
     * ------------------------------------------------------------------------- */
    var actor = addActorParticipant(pkg, diagram, "Encargado Sucursal / Administrador", 40, 220);

    var ui = addParticipant(pkg, diagram, ":PromotionsPageComponent", "Interface", 320, 220);

    var ctrl = addParticipant(pkg, diagram, ":PromotionController", "Controller", 620, 200);

    // 3 Entidades con nombres reales del código
    var entCode = addEntityParticipant(pkg, diagram, ":PromotionCode", 880, 150);
    var entUser = addEntityParticipant(pkg, diagram, ":User", 1090, 100);
    var entBranch = addEntityParticipant(pkg, diagram, ":Branch", 1250, 110);

    var step = 1;

    /* =====================================================================
     * FLUJO 1: CONSULTAR CÓDIGOS PROMOCIONALES
     * Actor -> Interface -> Controller -> Entity -> Controller -> Interface -> Actor
     * SIN fragmentos: el alcance (global vs sucursal) lo resuelve el controller
     * según el rol autenticado (sobreentendido).
     * ===================================================================== */

    // 1. El actor accede a la página de promociones
    addMessage(actor, ui, "1: consultarCodigos()", false, step++);

    // 1.1 Solicitud GET HTTP al backend
    addMessage(ui, ctrl,
        "1.1: GET /promotions (PromotionApiService.list)", false, step++);

    // 1.2 El controller consulta los códigos (filtrando por sucursal según el rol)
    addMessage(ctrl, entCode, "1.2: list_codes()", false, step++);

    // 1.3 Retorno de los códigos del alcance del actor
    addMessage(entCode, ctrl, "1.3: return(códigos)", true, step++);

    // 1.4 Retorno HTTP 200 con el listado hacia la interfaz
    addMessage(ctrl, ui,
        "1.4: return 200 OK (códigos promocionales)", true, step++);

    // 1.5 La interfaz renderiza el listado para el actor
    addMessage(ui, actor, "1.5: renderizarListado()", true, step++);

    /* =====================================================================
     * FLUJO 2: CREAR CÓDIGO PROMOCIONAL - FLUJO PRINCIPAL (HAPPY PATH)
     * Actor -> Interface -> Controller -> Entity -> Controller -> Interface -> Actor
     * Se modela primero el camino correcto; las alternativas/errores van al final.
     * ===================================================================== */

    // 2. El actor presiona 'Crear código' (openModal) y envía el formulario (create)
    addMessage(actor, ui, "2: crearCodigo()", false, step++);

    // 2.1 La interfaz valida el formulario antes de enviar (form.invalid / validUntilError)
    addMessage(ui, ui, "2.1: validarFormulario()", false, step++);

    // 2.2 Solicitud POST HTTP al backend
    addMessage(ui, ctrl,
        "2.2: POST /promotions (PromotionApiService.create)", false, step++);

    // 2.3 El controller resuelve la sucursal asignada del JWT
    addMessage(ctrl, entBranch, "2.3: resolverSucursalAsignada()", false, step++);

    // 2.4 Retorno del branch_id del usuario autenticado
    addMessage(entBranch, ctrl, "2.4: return(branch_id del JWT)", true, step++);

    // 2.5 El controller asigna el creador del código (created_by)
    addMessage(ctrl, entUser, "2.5: asignarCreador(created_by=current_user.sub)", false, step++);

    // 2.6 Retorno del creador asignado
    addMessage(entUser, ctrl, "2.6: return(creador_asignado)", true, step++);

    // 2.7 El controller persiste el código promocional
    addMessage(ctrl, entCode, "2.7: create_code(payload)", false, step++);

    // 2.8 Retorno del código creado correctamente
    addMessage(entCode, ctrl, "2.8: return(código_creado)", true, step++);

    // 2.9 Retorno HTTP 201 con el código creado hacia la interfaz
    addMessage(ctrl, ui,
        "2.9: return 201 Created (PromotionCodeRead)", true, step++);

    // 2.10 La interfaz recarga el listado tras el alta
    addMessage(ui, ui, "2.10: recargarListado()", false, step++);

    // 2.11 La interfaz confirma la creación al actor
    addMessage(ui, actor, "2.11: confirmarCreación()", true, step++);

    /* =====================================================================
     * FLUJO 3: ALTERNATIVAS Y ERRORES (al final, autocontenidos)
     * Cada casilla representa una rama mutuamente excluyente del camino principal.
     * ===================================================================== */

    /* =====================================================================
     * INICIO FRAGMENTO B: alt [alcance del código según rol]  (mensajes 2.12 a 2.15)
     * Rama 2.12-2.13 (Administrador con branch_id) y rama 2.14-2.15
     * (Encargado con sucursal ajena) son alternativas mutuamente excluyentes.
     * ===================================================================== */
    addCombinedFragment(pkg, diagram, "alt", "[alcance del código según rol]",
        40, 1030, -1180, -1340);

    // Rama alternativa 1 (Administrador): con branch_id -> rechazado (solo globales)
    addMessage(ctrl, ui,
        "2.12: raise 400 (admin: solo códigos globales)", true, step++);

    // 2.13 La interfaz informa el error de alcance al actor
    addMessage(ui, actor, "2.13: mostrarErrorAlcance()", true, step++);

    // Rama alternativa 2 (Encargado): con sucursal ajena -> rechazado
    addMessage(ctrl, ui,
        "2.14: raise 403 (encargado: sucursal no permitida)", true, step++);

    // 2.15 La interfaz informa el error de alcance al actor
    addMessage(ui, actor, "2.15: mostrarErrorAlcance()", true, step++);

    /* =====================================================================
     * FIN FRAGMENTO B: alt [alcance del código según rol]
     * ===================================================================== */

    /* =====================================================================
     * INICIO FRAGMENTO C: alt [validación de datos del payload]  (mensajes 2.16 a 2.18)
     * ===================================================================== */
    addCombinedFragment(pkg, diagram, "alt", "[validación de datos del payload]",
        40, 1030, -1390, -1520);

    // 2.16 El controller valida el payload (validate_discount)
    addMessage(ctrl, ctrl, "2.16: validate_discount()", false, step++);

    // 2.17 Retorno de error de validación (descuento >100% o fechas inválidas)
    addMessage(ctrl, ui,
        "2.17: return 422 (validación fallida)", true, step++);

    // 2.18 La interfaz informa el error de validación al actor
    addMessage(ui, actor, "2.18: mostrarErrorValidación()", true, step++);

    /* =====================================================================
     * FIN FRAGMENTO C: alt [validación de datos del payload]
     * ===================================================================== */

    /* =====================================================================
     * INICIO FRAGMENTO D: opt [código duplicado (IntegrityError)]  (mensajes 2.19 a 2.21)
     * Error condicional del create_code (restricción de unicidad).
     * ===================================================================== */
    addCombinedFragment(pkg, diagram, "opt", "[código duplicado (IntegrityError)]",
        40, 1030, -1570, -1700);

    // 2.19 Retorno del error de unicidad desde la entidad
    addMessage(entCode, ctrl, "2.19: return(IntegrityError código duplicado)", true, step++);

    // 2.20 Retorno 400 hacia la interfaz
    addMessage(ctrl, ui,
        "2.20: raise 400 (el código ya existe)", true, step++);

    // 2.21 La interfaz informa el error de código duplicado al actor
    addMessage(ui, actor, "2.21: mostrarErrorDuplicado()", true, step++);

    /* =====================================================================
     * FIN FRAGMENTO D: opt [código duplicado (IntegrityError)]
     * ===================================================================== */

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU25 con flujo principal y errores al final generado con éxito!", 0);
}

main();