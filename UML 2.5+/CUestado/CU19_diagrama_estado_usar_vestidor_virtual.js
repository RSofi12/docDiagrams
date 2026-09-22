// ============================================================
// ENTERPRISE ARCHITECT
// DIAGRAMA DE ESTADO (Statechart UML 2.5+) - CASO DE USO CU-19
// PROYECTO FASHIONSTORE
// CU19 - Usar vestidor virtual (Cliente; Móvil)
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
//  - Pseudoestado "choice": elemento tipo "Decision" (ROMBO de decisión)
//  - Estados         : elemento "State"
//  - Transiciones    : conector "ControlFlow" con el mensaje en
//    TransitionGuard (guardado una sola vez, sin duplicarlo en Name/Alias)
//
// CU19 se modela como <<extend>> de CU10: función opcional de realidad
// aumentada que el cliente activa sobre una prenda del catálogo.
// ============================================================

// ------------------------------------------------------------
// ESTRUCTURA DE DATOS: CASO DE USO CU-19
// (Índice i: CU_NOMBRES[i], CU_ESTADOS[i], CU_DECISIONES[i], CU_TRANSICIONES[i])
// ------------------------------------------------------------

var CU_NOMBRES = [
    "CU-19 - Usar vestidor virtual"
];

// Estados y pseudostates en orden de dibujo (cuadrícula vertical).
// Nombres conceptuales: describen la situación del caso de uso.
var CU_ESTADOS = [
    [
        "Inicio", "NavegandoCatalogo", "VestidorAbierto", "PermisoSolicitado",
        "¿Permiso concedido?", "IniciandoSesion", "CargandoPrenda",
        "ProbandoVestidor", "CambiandoVariante", "ConsultandoVariante",
        "SesionExpirada", "Error", "Fin"
    ]
];

// Pseudoestados que se dibujan como ROMBO de decisión (choice, tipo "Decision")
var CU_DECISIONES = [
    ["¿Permiso concedido?"]
];

// Transiciones formato: "origen -> destino|mensaje conceptual"
var CU_TRANSICIONES = [
    [
        "Inicio -> NavegandoCatalogo|Cliente navega el catálogo y selecciona una prenda",
        "NavegandoCatalogo -> VestidorAbierto|Solicita probar la prenda en el vestidor virtual",
        "VestidorAbierto -> PermisoSolicitado|Se solicita permiso de cámara",
        "VestidorAbierto -> Fin|Cliente cancela la prueba",
        "PermisoSolicitado -> ¿Permiso concedido?|Se evalúa la autorización de la cámara",
        "¿Permiso concedido? -> IniciandoSesion|[permitido] se inicia la realidad aumentada",
        "¿Permiso concedido? -> Error|[denegado] sin cámara no hay vestidor",
        "IniciandoSesion -> CargandoPrenda|Servicio listo; la prenda está lista para probarse",
        "IniciandoSesion -> Error|[sin conexión] no se pudo iniciar el servicio",
        "CargandoPrenda -> ProbandoVestidor|La prenda se superpone sobre el cliente",
        "CargandoPrenda -> Error|[imagen inválida] la prenda no pudo procesarse",
        "ProbandoVestidor -> CambiandoVariante|Cliente elige otra talla o color",
        "CambiandoVariante -> ConsultandoVariante|Solicita la variante elegida",
        "ConsultandoVariante -> CargandoPrenda|Variante obtenida; se recarga la prenda",
        "ConsultandoVariante -> Error|[sin disponibilidad] la variante no está disponible",
        "ProbandoVestidor -> SesionExpirada|La sesión del vestidor expira",
        "SesionExpirada -> Fin|El vestidor se cierra",
        "ProbandoVestidor -> Fin|Cliente sale del vestidor",
        "Error -> VestidorAbierto|Permitir la cámara y reintentar",
        "Error -> NavegandoCatalogo|Probar con otra prenda",
        "Error -> Fin|Cliente abandona la prueba"
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