/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * CASO DE USO: CU16 - Realizar compra digital y consultar estado del pedido
 * DESCRIPCIÓN: Checkout vía web con pago en efectivo o pasarela electrónica (Stripe),
 *              y seguimiento del estado del pedido (pendiente, pagado, fallido).
 * ACTOR: Cliente
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0.1514
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NOTA DE REORDEN (simplificación a las entidades esenciales del CU16):
 * - Participan únicamente: :Usuario, :Pedido, :Variante y la pasarela :PasarelaPago
 *   (Stripe, servicio externo). Se omiten :Carrito e :Inventario: el controlador
 *   interactúa con variantes para el stock (Inventory se agrupa por variante).
 * - Los mensajes usan las funciones reales del código:
 *   checkout_cash, create_stripe_payment, confirm_stripe_payment, _create_order_from_cart,
 *   _allocate_inventory, list_orders, PaymentIntent.create y el webhook payment_intent.succeeded.
 * - Cada fragmento (alt efectivo / opt tarjeta) se declara DESPUÉS de su solicitud HTTP
 *   y sus mensajes quedan contiguos: el render posterior se crea justo después del último
 *   retorno del fragmento para que no queden separados.
 * - Validaciones del controlador como mensajes recursivos: validarCarritoActivo()
 *   y validarConfiguracionStripe(). La autenticación consulta la entidad :Usuario.
 * - Nombres reales del frontend: :CartPageComponent (Boundary), functions de backend
 *   en los mensajes, :OrderController como Control.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU16 - Realizar Compra Digital y Consultar Estado del Pedido";

function log(msg) {
    Session.Output("[CU16-Secuencia] " + msg);
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

    // b = -2650: la lifeline del actor debe extenderse más abajo que los demás
    // participantes para llegar hasta el último mensaje (3.16: interface -> actor).
    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-2650;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2200;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2200;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

/**
 * Agrega mensaje de secuencia. isReturn = true crea la flecha discontinua de retorno.
 * Si src === dst se crea la flecha recursiva de validación sobre la misma línea de vida.
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

/**
 * Re-fija los bounds del DiagramObject del actor DESPUÉS de crear todos los
 * mensajes. EA recalcula las lifelines al insertar mensajes, ignorando el b
 * inicial; volver a fijarlo al final y llamar Update() hace que la lifeline
 * del actor llegue hasta el último mensaje (3.16, interface -> actor).
 */
function stretchActorLifeline(diagram, actorEl) {
    for (var i = 0; i < diagram.DiagramObjects.Count; i++) {
        var dObj = diagram.DiagramObjects.GetAt(i);
        if (dObj.ElementID == actorEl.ElementID) {
            dObj.Top = -20;
            dObj.Bottom = -2650;
            dObj.Update();
            return;
        }
    }
}

function main() {
    log("Iniciando generación de CU16 con participantes esenciales y mensajes del código...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Cliente -> :CartPageComponent (Boundary) -> :OrderController (Control)
     * -> :Usuario, :Pedido, :Variante, :PasarelaPago (Entidades / externo)
     * ------------------------------------------------------------------------- */
    var actorCliente = addActorParticipant(pkg, diagram, "Cliente",               40,   100);
    var uiCompra     = addParticipant(pkg, diagram, ":CartPageComponent",         "Interface",   200, 250);
    var ctrlCompra   = addParticipant(pkg, diagram, ":OrderController",           "Controller",  510, 240);

    var entUsuario   = addEntityParticipant(pkg, diagram, ":Usuario",             810, 160);
    var entPedido    = addEntityParticipant(pkg, diagram, ":Pedido",             1030, 160);
    var entVariante  = addEntityParticipant(pkg, diagram, ":Variante",           1250, 180);
    var entPago      = addEntityParticipant(pkg, diagram, ":PasarelaPago",       1490, 200);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: CONSULTAR ESTADO DEL PEDIDO (GET /orders/me)
     * ------------------------------------------------------------------------- */
    addMessage(actorCliente, uiCompra,
        "1: consultarEstadoPedido()", false, step++);

    addMessage(uiCompra, ctrlCompra,
        "1.1: GET /orders/me", false, step++);

    addMessage(ctrlCompra, entUsuario,
        "1.2: verificarUsuarioAutenticado()", false, step++);

    addMessage(entUsuario, ctrlCompra,
        "1.3: return(usuario_autorizado)", true, step++);

    addMessage(ctrlCompra, entPedido,
        "1.4: list_orders()", false, step++);

    addMessage(entPedido, ctrlCompra,
        "1.5: return(lista_pedidos)", true, step++);

    addMessage(ctrlCompra, uiCompra,
        "1.6: return 200 OK (lista_pedidos)", true, step++);

    addMessage(uiCompra, actorCliente,
        "1.7: renderizarEstadoPedido()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO 2: COMPRA DIGITAL CON PAGO EN EFECTIVO (POST /payments/cash/checkout)
     * ------------------------------------------------------------------------- */
    addMessage(actorCliente, uiCompra,
        "2: realizarCompraDigital(pago_efectivo)", false, step++);

    addMessage(uiCompra, ctrlCompra,
        "2.1: POST /payments/cash/checkout (checkout_cash)", false, step++);

    /* -------------------------------------------------------------------------
     * 4. FRAGMENTO ALT DE PAGO EN EFECTIVO (DECLARADO DESPUÉS DEL POST 2.1)
     * Contiene mensajes 2.2..2.9; el render 2.10 se crea inmediatamente después.
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "alt", "[Método de pago == efectivo]", 510, 1430, -200, -770);

    addMessage(ctrlCompra, entUsuario,
        "2.2: verificarUsuarioAutenticado()", false, step++);

    addMessage(entUsuario, ctrlCompra,
        "2.3: return(usuario_autorizado)", true, step++);

    // VALIDACIÓN: el controlador verifica que exista un carrito activo con items
    addMessage(ctrlCompra, ctrlCompra,
        "2.4: validarCarritoActivo()", false, step++);

    addMessage(ctrlCompra, entPedido,
        "2.5: _create_order_from_cart()", false, step++);

    addMessage(entPedido, ctrlCompra,
        "2.6: return(pedido_pagado)", true, step++);

    addMessage(ctrlCompra, entVariante,
        "2.7: _allocate_inventory()", false, step++);

    addMessage(entVariante, ctrlCompra,
        "2.8: return(stock_actualizado)", true, step++);

    addMessage(ctrlCompra, uiCompra,
        "2.9: return 201 Created (pedido_confirmado)", true, step++);

    // Render inmediatamente después del último mensaje del alt (sin separación)
    addMessage(uiCompra, actorCliente,
        "2.10: mostrarConfirmacionPedido()", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FLUJO 3: COMPRA DIGITAL CON PAGO ONLINE (POST /payments/stripe/checkout) -> opt
     * ------------------------------------------------------------------------- */
    addMessage(actorCliente, uiCompra,
        "3: iniciarPagoStripe()", false, step++);

    addMessage(uiCompra, ctrlCompra,
        "3.1: POST /payments/stripe/checkout (create_stripe_payment)", false, step++);

    /* -------------------------------------------------------------------------
     * 6. FRAGMENTO OPT DE PAGO ONLINE (DECLARADO DESPUÉS DEL POST 3.1)
     * Contiene mensajes 3.2..3.15; el render final 3.16 es interface -> actor.
     * ------------------------------------------------------------------------- */
    addCombinedFragment(pkg, diagram, "opt", "[Método de pago == tarjeta (Stripe)]", 510, 1690, -980, -1980);

    addMessage(ctrlCompra, entUsuario,
        "3.2: verificarUsuarioAutenticado()", false, step++);

    addMessage(entUsuario, ctrlCompra,
        "3.3: return(usuario_autorizado)", true, step++);

    // VALIDACIÓN: el controlador verifica la configuración de Stripe y el total
    addMessage(ctrlCompra, ctrlCompra,
        "3.4: validarConfiguracionStripe()", false, step++);

    addMessage(ctrlCompra, entPedido,
        "3.5: _create_order_from_cart()", false, step++);

    addMessage(entPedido, ctrlCompra,
        "3.6: return(pedido_pendiente)", true, step++);

    addMessage(ctrlCompra, entPago,
        "3.7: PaymentIntent.create(total)", false, step++);

    addMessage(entPago, ctrlCompra,
        "3.8: return(client_secret)", true, step++);

    addMessage(ctrlCompra, uiCompra,
        "3.9: return 201 Created (client_secret)", true, step++);

    addMessage(entPago, ctrlCompra,
        "3.10: notificarWebhook(payment_intent.succeeded)", false, step++);

    addMessage(ctrlCompra, entPedido,
        "3.11: confirm_stripe_payment()", false, step++);

    addMessage(entPedido, ctrlCompra,
        "3.12: return(pedido_pagado)", true, step++);

    addMessage(ctrlCompra, entVariante,
        "3.13: _allocate_inventory()", false, step++);

    addMessage(entVariante, ctrlCompra,
        "3.14: return(stock_actualizado)", true, step++);

    // El controlador retorna el pedido pagado hacia la interfaz (cierre del flujo)
    addMessage(ctrlCompra, uiCompra,
        "3.15: return 200 OK (pedido_pagado)", true, step++);

    // Render inmediatamente después, como último mensaje: interface -> actor
    addMessage(uiCompra, actorCliente,
        "3.16: mostrarConfirmacionPedido()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorCliente);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU16 reordenado con participantes esenciales y mensajes del código generado con éxito!", 0);
}

main();