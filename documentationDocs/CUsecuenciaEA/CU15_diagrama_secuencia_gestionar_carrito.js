/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU15 - Gestionar carrito de compras
 * DESCRIPCIÓN: Adición, edición y eliminación de productos en el carrito antes de la compra.
 * ACTOR: Cliente
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NOTA DE SECUENCIA (mismo criterio que CU13/CU16):
 * - Sin 'alt' de autenticación: el actor correcto (Cliente) inicia el flujo directo.
 * - 'alt' de validación de stock (flujo agregar) declarado DESPUÉS del POST 2.1.
 * - Flujos opcionales (editar cantidad, eliminar producto, vaciar carrito) como
 *   fragmentos combinados 'opt' reales con su guard, NO embebidos en el mensaje.
 * - Entidades en RECUADROS RECTANGULARES con cabecera <<Entity>> y :Nombre mediante
 *   addEntityParticipant (Entity\u00A0).
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU15 - Gestionar Carrito de Compras";

function log(msg) {
    Session.Output("[CU15-Secuencia] " + msg);
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-2300;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2300;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2300;", "");
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
 * Agrega fragmentos combinados (alt, loop, opt).
 */
function addCombinedFragment(pkg, diagram, type, guardLabel, left, right, top, bottom) {
    try {
        var frag = pkg.Elements.AddNew(guardLabel, "InteractionFragment");
        frag.Stereotype = type; // "alt", "loop" u "opt"
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
    log("Iniciando generación de CU15 con orden cronológico de fragmentos (mismo criterio que CU13)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE (Todos en RECUADROS RECTANGULARES)
     * Actor -> Boundary -> Controller -> Entities
     * ------------------------------------------------------------------------- */
    var actorCliente  = addActorParticipant(pkg, diagram, "Cliente",                 40,   90);
    var uiCarrito     = addParticipant(pkg, diagram, ":CartPageComponent",           "Interface",  190, 230);
    var ctrlCarrito   = addParticipant(pkg, diagram, ":CartController",              "Controller", 480, 200);

    // 5 Entidades en recuadros rectangulares con cabecera <<Entity>>
    var entCarrito    = addEntityParticipant(pkg, diagram, ":Carrito",               740, 140);
    var entItem        = addEntityParticipant(pkg, diagram, ":ItemCarrito",          930, 150);
    var entVariante   = addEntityParticipant(pkg, diagram, ":Variante",             1130, 140);
    var entProducto   = addEntityParticipant(pkg, diagram, ":Producto",             1320, 140);
    var entInventario = addEntityParticipant(pkg, diagram, ":Inventario",           1510, 150);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: CONSULTAR CARRITO ACTUAL (GET /cart/current)
     * ------------------------------------------------------------------------- */

    // 1. El Cliente ingresa a la vista del carrito
    addMessage(actorCliente, uiCarrito,
        "1: consultarCarritoActual()", false, step++);

    // 1.1 Solicitud GET HTTP al backend
    addMessage(uiCarrito, ctrlCarrito,
        "1.1: GET /cart/current (CartApiService.getCurrentCart)", false, step++);

    // 1.2 El controlador obtiene el carrito activo del cliente
    addMessage(ctrlCarrito, entCarrito,
        "1.2: obtenerCarritoActivo()", false, step++);

    // 1.3 Retorno del carrito activo
    addMessage(entCarrito, ctrlCarrito,
        "1.3: return(carrito_activo)", true, step++);

    // 1.4 El controlador consulta los items con detalle de variante y producto
    addMessage(ctrlCarrito, entItem,
        "1.4: consultarItemsCarrito()", false, step++);

    // 1.5 Retorno de la lista de items con detalle (SKU, talla, color, precio)
    addMessage(entItem, ctrlCarrito,
        "1.5: return(lista_items_con_detalle)", true, step++);

    // 1.6 Retorno HTTP 200 con el carrito serializado hacia la interfaz
    addMessage(ctrlCarrito, uiCarrito,
        "1.6: return 200 OK (carrito_serializado)", true, step++);

    // 1.7 La interfaz renderiza el carrito para el Cliente
    addMessage(uiCarrito, actorCliente,
        "1.7: renderizarCarrito()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FLUJO 2: AGREGAR PRODUCTO AL CARRITO (POST /cart/items)
     * ------------------------------------------------------------------------- */
    addMessage(actorCliente, uiCarrito,
        "2: agregarProductoAlCarrito(datos_item)", false, step++);

    // 2.1 Solicitud POST HTTP al backend
    addMessage(uiCarrito, ctrlCarrito,
        "2.1: POST /cart/items (CartApiService.addItem)", false, step++);

    // 2.2 El controlador obtiene el carrito activo
    addMessage(ctrlCarrito, entCarrito,
        "2.2: obtenerCarritoActivo()", false, step++);

    // 2.3 Retorno del carrito activo
    addMessage(entCarrito, ctrlCarrito,
        "2.3: return(carrito_activo)", true, step++);

    // 2.4 El controlador valida stock disponible de la variante en inventario
    addMessage(ctrlCarrito, entInventario,
        "2.4: verificarStockDisponible(variante_id)", false, step++);

    // 2.5 Retorno del stock disponible
    addMessage(entInventario, ctrlCarrito,
        "2.5: return(stock_disponible)", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FRAGMENTO ALT DE STOCK (FLUJO AGREGAR PRODUCTO)
     * ------------------------------------------------------------------------- */
    // >>> INICIO alt [stock disponible >= cantidad]  (l=440; r=1680; t=-720; b=-940)
    addCombinedFragment(pkg, diagram, "alt", "[stock disponible >= cantidad]", 440, 1680, -720, -940);

    // 2.6 El controlador registra o incrementa el item en el carrito
    addMessage(ctrlCarrito, entItem,
        "2.6: registrarItemCarrito()", false, step++);

    // 2.7 Retorno del item registrado
    addMessage(entItem, ctrlCarrito,
        "2.7: return(item_registrado)", true, step++);

    // 2.8 Retorno HTTP 201 con el carrito actualizado hacia la interfaz
    addMessage(ctrlCarrito, uiCarrito,
        "2.8: return 201 Created (carrito_actualizado)", true, step++);

    // 2.9 La interfaz actualiza la vista y los totales del carrito
    addMessage(uiCarrito, actorCliente,
        "2.9: actualizarVistaCarrito()", true, step++);
    // <<< FIN alt [stock disponible >= cantidad]

    /* -------------------------------------------------------------------------
     * 6. FLUJO 3: EDITAR CANTIDAD (PATCH /cart/items/{item_id}) -> opt
     * ------------------------------------------------------------------------- */
    addMessage(actorCliente, uiCarrito,
        "3: modificarCantidadItem()", false, step++);

    // 3.1 Solicitud PATCH HTTP al backend
    addMessage(uiCarrito, ctrlCarrito,
        "3.1: PATCH /cart/items/{item_id} (CartApiService.updateItem)", false, step++);

    // >>> INICIO opt [editar cantidad]  (l=440; r=1680; t=-960; b=-1300)
    addCombinedFragment(pkg, diagram, "opt", "[editar cantidad]", 440, 1680, -960, -1300);

    addMessage(ctrlCarrito, entInventario,
        "3.2: verificarStockDisponible()", false, step++);

    // 3.3 Retorno del stock disponible
    addMessage(entInventario, ctrlCarrito,
        "3.3: return(stock_disponible)", true, step++);

    // 3.4 El controlador actualiza la cantidad del item
    addMessage(ctrlCarrito, entItem,
        "3.4: actualizarCantidadItem()", false, step++);

    // 3.5 Retorno del item actualizado
    addMessage(entItem, ctrlCarrito,
        "3.5: return(item_actualizado)", true, step++);

    // 3.6 Retorno HTTP 200 con el carrito actualizado
    addMessage(ctrlCarrito, uiCarrito,
        "3.6: return 200 OK (carrito_actualizado)", true, step++);
    // <<< FIN opt [editar cantidad]

    // 3.7 La interfaz actualiza la vista y los totales (cierre del flujo, fuera del opt)
    addMessage(uiCarrito, actorCliente,
        "3.7: actualizarVistaCarrito()", true, step++);

    /* -------------------------------------------------------------------------
     * 7. FLUJO 4: ELIMINAR PRODUCTO (DELETE /cart/items/{item_id}) -> opt
     * ------------------------------------------------------------------------- */
    addMessage(actorCliente, uiCarrito,
        "4: eliminarProducto(item_id)", false, step++);

    // 4.1 Solicitud DELETE HTTP al backend
    addMessage(uiCarrito, ctrlCarrito,
        "4.1: DELETE /cart/items/{item_id} (CartApiService.removeItem)", false, step++);

    // >>> INICIO opt [eliminar producto]  (l=440; r=1680; t=-1390; b=-1570)
    addCombinedFragment(pkg, diagram, "opt", "[eliminar producto]", 440, 1680, -1390, -1570);

    addMessage(ctrlCarrito, entItem,
        "4.2: eliminarItemCarrito()", false, step++);

    // 4.3 Retorno del item eliminado
    addMessage(entItem, ctrlCarrito,
        "4.3: return(item_eliminado)", true, step++);

    // 4.4 Retorno HTTP 200 con el carrito actualizado
    addMessage(ctrlCarrito, uiCarrito,
        "4.4: return 200 OK (carrito_actualizado)", true, step++);
    // <<< FIN opt [eliminar producto]

    // 4.5 La interfaz actualiza la vista y los totales (cierre del flujo, fuera del opt)
    addMessage(uiCarrito, actorCliente,
        "4.5: actualizarVistaCarrito()", true, step++);

    /* -------------------------------------------------------------------------
     * 8. FLUJO 5: VACIAR CARRITO (DELETE /cart/current) -> opt
     * ------------------------------------------------------------------------- */
    addMessage(actorCliente, uiCarrito,
        "5: vaciarCarrito()", false, step++);

    // 5.1 Solicitud DELETE HTTP del carrito completo
    addMessage(uiCarrito, ctrlCarrito,
        "5.1: DELETE /cart/current (CartApiService.clearCart)", false, step++);

    // >>> INICIO opt [vaciar carrito]  (l=440; r=1680; t=-1660; b=-1840)
    addCombinedFragment(pkg, diagram, "opt", "[vaciar carrito]", 440, 1680, -1660, -1840);

    addMessage(ctrlCarrito, entItem,
        "5.2: eliminarTodosItems()", false, step++);

    // 5.3 Retorno del carrito vacío
    addMessage(entItem, ctrlCarrito,
        "5.3: return(carrito_vacio)", true, step++);

    // 5.4 Retorno HTTP 200 con el carrito actualizado
    addMessage(ctrlCarrito, uiCarrito,
        "5.4: return 200 OK (carrito_actualizado)", true, step++);
    // <<< FIN opt [vaciar carrito]

    // 5.5 La interfaz actualiza la vista y los totales (cierre del flujo, fuera del opt)
    addMessage(uiCarrito, actorCliente,
        "5.5: actualizarVistaCarrito()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU15 con fragmento alt y flujos opt como fragmentos generado con éxito!", 0);
}

main();