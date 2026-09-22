// ============================================================
// ENTERPRISE ARCHITECT
// DIAGRAMA DE ESTADO (Statechart UML 2.5+) - CASO DE USO CU-21
// PROYECTO FASHIONSTORE
// CU21 - Recibir recomendaciones de IA (Cliente; Web)
// LENGUAJE: JScript (Motor nativo en Enterprise Architect)
//
// Formato: replica la estructura del script de estado de CU-25
// (estados + transiciones) adaptada a JScript, pero corregida:
// usa ARREGLOS planos (var + loop) y objetos planos, el mismo patrón
// de los scripts que ya funcionan en EA. NO usa Scripting.Dictionary
// ni Enumerator (no los resuelve el motor JScript de EA/VSA).
//
// Componentes UML 2.5 utilizados:
//  - Estado inicial  : StateNode Subtype 100 (círculo lleno)
//  - Estado final    : StateNode Subtype 101 (círculo con bulbo)
//  - Pseudoestado "choice": elemento tipo "Decision" (ROMBO de decisión;
//    EA documenta Choice como "A Choice or Decision Element")
//  - Estados         : elemento "State"
//  - Transiciones    : conector "ControlFlow" (flecha recta sólida, igual
//    que CU-25) con el mensaje en TransitionGuard (guardado una sola vez,
//    sin duplicarlo en Name/Alias)
//
// IMPLEMENTACIÓN REFERENCIADA (backend/frontend):
// - frontend: features/cliente/pages/catalog-page.component.ts/.html
//   (loadRecommendations -> "Recomendaciones para ti", recordProductView).
// - backend: services/recommendation_service.py (get_recommendations,
//   record_interaction view/add_to_cart/completed_order, train ALS implícito),
//   routes/recommendation_routes.py (GET /recommendations/collaborative/user/{id}),
//   routes/catalog_routes.py (record_product_view), services/cart_service.py
//   y order_service.py (registro de interacciones).
// ============================================================

// ------------------------------------------------------------
// ESTRUCTURA DE DATOS: CASO DE USO CU-21
// (Índice i: CU_NOMBRES[i], CU_ESTADOS[i], CU_DECISIONES[i], CU_TRANSICIONES[i])
// ------------------------------------------------------------

var CU_NOMBRES = [
    "CU-21 - Recibir recomendaciones de IA"
];

// Estados y pseudostates en orden de dibujo (cuadrícula vertical).
// Nombres conceptuales: describen la situación o estado del caso de uso.
var CU_ESTADOS = [
    [
        "Inicio", "Navegando el catálogo", "¿Es cliente?", "Solicitando recomendaciones",
        "¿Personalizadas o populares?", "Generando recomendaciones personalizadas",
        "Generando recomendaciones populares", "Ordenando por afinidad",
        "Mostrando recomendaciones", "Tipo de interacción", "Viendo producto",
        "Agregando al carrito", "Completando pedido", "Registrando interacción",
        "Actualizando modelo de preferencias", "Error", "Fin"
    ]
];

// Pseudoestados que se dibujan como ROMBO de decisión (choice, tipo "Decision")
var CU_DECISIONES = [
    ["¿Es cliente?", "¿Personalizadas o populares?", "Tipo de interacción"]
];

// Transiciones formato: "origen -> destino|mensaje conceptual"
var CU_TRANSICIONES = [
    [
        "Inicio -> Navegando el catálogo|Cliente inicia sesión en la tienda",
        "Navegando el catálogo -> ¿Es cliente?|Se verifica el rol de la sesión",
        "¿Es cliente? -> Solicitando recomendaciones|[cliente] pide sugerencias de prendas",
        "¿Es cliente? -> Fin|[otro rol] la sección de recomendaciones no se ofrece",
        "Solicitando recomendaciones -> ¿Personalizadas o populares?|Se obtienen sugerencias de prendas disponibles",
        "Solicitando recomendaciones -> Error|No llegan sugerencias o no hay prendas disponibles",
        "¿Personalizadas o populares? -> Generando recomendaciones personalizadas|[hay historial de gustos del cliente]",
        "¿Personalizadas o populares? -> Generando recomendaciones populares|[sin historial propio]",
        "Generando recomendaciones personalizadas -> Ordenando por afinidad|Se puntúan las prendas según afinidad con el cliente",
        "Generando recomendaciones populares -> Ordenando por afinidad|Se ordenan por preferencias generales",
        "Ordenando por afinidad -> Mostrando recomendaciones|Se muestran las prendas mejor puntuadas (listado acotado)",
        "Mostrando recomendaciones -> Tipo de interacción|El cliente reacciona a una prenda sugerida",
        "Tipo de interacción -> Viendo producto|[consulta el detalle]",
        "Tipo de interacción -> Agregando al carrito|[añade la prenda al carrito]",
        "Tipo de interacción -> Completando pedido|[finaliza la compra de la prenda]",
        "Viendo producto -> Registrando interacción|La consulta del detalle queda registrada",
        "Agregando al carrito -> Registrando interacción|El agregado queda registrado",
        "Completando pedido -> Registrando interacción|La compra queda registrada",
        "Registrando interacción -> Mostrando recomendaciones|El listado se renueva con lo aprendido",
        "Registrando interacción -> Actualizando modelo de preferencias|Periódicamente se actualiza el modelo de gustos",
        "Actualizando modelo de preferencias -> Mostrando recomendaciones|El modelo quedó actualizado",
        "Error -> Mostrando recomendaciones|La sección queda sin sugerencias; la navegación continúa",
        "Mostrando recomendaciones -> Fin|El cliente sale del catálogo"
    ]
];

// ------------------------------------------------------------
// SUB PRINCIPAL
// ------------------------------------------------------------

function main() {

    var package = getTargetPackage();
    if (package == null) {
        Session.Output("ERROR: No se pudo determinar el Package de destino.");
        return;
    }

    var totalDiagramas = 0;

    for (var i = 0; i < CU_NOMBRES.length; i++) {
        Session.Output("Generando: " + CU_NOMBRES[i]);
        if (crearDiagrama(package, CU_NOMBRES[i], CU_ESTADOS[i], CU_DECISIONES[i], CU_TRANSICIONES[i])) {
            totalDiagramas = totalDiagramas + 1;
        }
    }

    Session.Output(" ");
    Session.Output("============================================");
    Session.Output(" TOTAL DIAGRAMAS CREADOS: " + totalDiagramas + " de " + CU_NOMBRES.length);
    Session.Output("============================================");
}

// ------------------------------------------------------------
// OBTENER PAQUETE DE DESTINO (con fallback al modelo raíz)
// ------------------------------------------------------------

function getTargetPackage() {
    var selectedPkg = Repository.GetTreeSelectedPackage();
    if (selectedPkg != null) {
        Session.Output("Usando paquete seleccionado: " + selectedPkg.Name);
        return selectedPkg;
    }

    var roots = Repository.Models;
    if (roots.Count == 0) return null;
    var root = roots.GetAt(0);
    for (var i = 0; i < root.Packages.Count; i++) {
        var p = root.Packages.GetAt(i);
        if (p.Name == "CUdiagrams") return p;
    }
    var newPkg = root.Packages.AddNew("CUdiagrams", "Package");
    newPkg.Update();
    root.Packages.Refresh();
    Session.Output("Paquete creado: CUdiagrams");
    return newPkg;
}

// ------------------------------------------------------------
// FUNCIÓN: CREAR DIAGRAMA DE ESTADO (Statechart)
// ------------------------------------------------------------

function crearDiagrama(package, diagramName, estados, decisiones, transiciones) {

    var i, k, m, n;
    var estadoActual, transicionActual;
    var origen, destino, condicion;
    var posX, posY, ancho, alto;
    var elementoObj;

    // Crear el diagrama (Statechart = máquina de estados UML 2.5)
    var diagram = package.Diagrams.AddNew(diagramName, "Statechart");
    diagram.Update();

    // Mapa nombre -> elemento, implementado con objeto plano (JScript puro)
    var elementosMap = {};

    // Crear nodo inicial (si existe "Inicio")
    for (i = 0; i < estados.length; i++) {
        if (estados[i] == "Inicio") {
            elementoObj = crearNodoInicial(package);
            elementosMap[estados[i]] = elementoObj;
            break;
        }
    }

    // Crear nodo final (si existe "Fin")
    for (i = 0; i < estados.length; i++) {
        if (estados[i] == "Fin") {
            elementoObj = crearNodoFinal(package);
            elementosMap[estados[i]] = elementoObj;
            break;
        }
    }

    // Crear estados y pseudostates restantes (excluyendo Inicio y Fin)
    for (k = 0; k < estados.length; k++) {
        estadoActual = estados[k];
        if (estadoActual == "Inicio" || estadoActual == "Fin") continue;
        if (esDecision(decisiones, estadoActual)) {
            // ROMBO de decisión (choice, elemento tipo "Decision")
            elementosMap[estadoActual] = crearDecision(package, estadoActual);
        } else {
            elementosMap[estadoActual] = crearEstado(package, estadoActual);
        }
    }

    // Agregar los elementos al diagrama: cuadrícula vertical
    // Los rombos de decisión se dibujan como cajas pequeñas (EA renderiza el rombo)
    for (m = 0; m < estados.length; m++) {
        estadoActual = estados[m];
        if (elementosMap[estadoActual] != undefined) {
            elementoObj = elementosMap[estadoActual];
            posX = 200;
            posY = 50 + m * 70;
            if (esDecision(decisiones, estadoActual)) {
                ancho = 40;
                alto = 40;
            } else {
                ancho = 160;
                alto = 45;
            }
            agregarElemento(diagram, elementoObj, posX, posY, posX + ancho, posY + alto);
        }
    }

    // Crear transiciones entre elementos
    for (n = 0; n < transiciones.length; n++) {
        transicionActual = transiciones[n];

        // Formato: "origen -> destino|guardia"
        var flechaPos = transicionActual.indexOf(" -> ");
        if (flechaPos > 0) {
            origen = trim(transicionActual.substring(0, flechaPos));
            var barraPos = transicionActual.indexOf("|");
            if (barraPos > 0) {
                destino = trim(transicionActual.substring(flechaPos + 4, barraPos));
                condicion = transicionActual.substring(barraPos + 1);
            } else {
                destino = trim(transicionActual.substring(flechaPos + 4));
                condicion = "";
            }

            if (elementosMap[origen] != undefined && elementosMap[destino] != undefined) {
                crearTransicion(elementosMap[origen], elementosMap[destino], condicion);
            } else {
                Session.Output("ADVERTENCIA: Origen/destino no encontrado (" + diagramName + "): " + transicionActual);
            }
        } else {
            Session.Output("ADVERTENCIA: Formato inválido (" + diagramName + "): " + transicionActual);
        }
    }

    // Actualizar el diagrama
    diagram.Update();
    package.Update();

    return true;
}

// ------------------------------------------------------------
// FUNCIONES AUXILIARES
// ------------------------------------------------------------

function esDecision(decisiones, nombre) {
    for (var i = 0; i < decisiones.length; i++) {
        if (decisiones[i] == nombre) return true;
    }
    return false;
}

function trim(str) {
    return str.replace(/^\s+|\s+$/g, "");
}

function crearEstado(package, nombre) {
    var elemento = package.Elements.AddNew(nombre, "State");
    elemento.Update();
    return elemento;
}

function crearDecision(package, nombre) {
    // Pseudoestado "choice" -> rombo de decisión (UML 2.5).
    // EA implementa "Choice" como un elemento tipo "Decision" (ver ayuda
    // oficial: "A Choice or Decision Element"). StateNode+Subtype 107 no
    // se renderiza como rombo cuando se crea vía AddNew (aparece como
    // "Dependency"), por eso se usa el tipo "Decision".
    var elemento = package.Elements.AddNew(nombre, "Decision");
    elemento.Update();
    return elemento;
}

function crearNodoInicial(package) {
    var elemento = package.Elements.AddNew("Inicio", "StateNode");
    elemento.Subtype = 100;
    elemento.Update();
    return elemento;
}

function crearNodoFinal(package) {
    var elemento = package.Elements.AddNew("Fin", "StateNode");
    elemento.Subtype = 101;
    elemento.Update();
    return elemento;
}

function agregarElemento(diagram, elemento, izquierda, arriba, derecha, abajo) {
    var objeto = diagram.DiagramObjects.AddNew(
        "l=" + izquierda + ";r=" + derecha + ";t=" + arriba + ";b=" + abajo + ";",
        "");
    objeto.ElementID = elemento.ElementID;
    objeto.Update();
}

function crearTransicion(origen, destino, condicion) {
    // Conector "ControlFlow": flecha recta sólida con punta (igual que CU-25).
    // El mensaje se guarda UNA sola vez en TransitionGuard (evita que el texto
    // se repita en Name y Alias dentro de Properties) y EA lo muestra sobre
    // la línea, igual que en CU-25.
    var conector = origen.Connectors.AddNew("", "ControlFlow");
    conector.SupplierID = destino.ElementID;
    conector.Update();

    if (condicion != "") {
        conector.TransitionGuard = condicion;
        conector.Update();
    }
}

// ============================================================
// EJECUTAR (con captura de errores para depuración en EA)
// ============================================================

try {
    main();
} catch (err) {
    Session.Output("ERROR EN EL SCRIPT: " + err.message);
    Session.Prompt("Error al ejecutar el diagrama de estado: " + err.message, 0);
}