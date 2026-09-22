// ============================================================
// ENTERPRISE ARCHITECT
// DIAGRAMA DE ESTADO - CASO DE USO CU-25
// PROYECTO FASHIONSTORE
// CU25 - Gestionar códigos promocionales
// LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
//
// Replica la estructura del script VBScript "diagrama de estado.txt"
// (Dictionary de estados/transiciones + generador de diagrama),
// adaptada a JScript y enfocada únicamente en CU-25.
// ============================================================

// ------------------------------------------------------------
// ESTRUCTURA DE DATOS: CASO DE USO CU-25
// ------------------------------------------------------------

var dictCU = new ActiveXObject("Scripting.Dictionary");

// ---------- CU-25 Gestionar códigos promocionales ----------
var cu25 = new ActiveXObject("Scripting.Dictionary");
cu25.Add("nombre", "Gestionar códigos promocionales");
cu25.Add("estados", [
    "Inicio", "Listando", "Mostrando", "FormularioAbierto",
    "Creando", "CodigoCreado", "Error", "Fin"
]);
cu25.Add("transiciones", [
    "Inicio -> Listando|Admin/Encargado accede al módulo de promociones",
    "Listando -> Mostrando|Códigos obtenidos (GET /promotions)",
    "Listando -> Error|Fallo en la consulta de códigos",
    "Mostrando -> FormularioAbierto|Presiona 'Crear código'",
    "FormularioAbierto -> Creando|Envía formulario válido (código, tipo, valor, vigencia)",
    "FormularioAbierto -> Error|Datos inválidos en el formulario",
    "Creando -> CodigoCreado|create_code persiste el código (201)",
    "Creando -> Error|Código duplicado o alcance no permitido por rol",
    "CodigoCreado -> Mostrando|Listado recargado tras la creación",
    "Error -> FormularioAbierto|Corregir datos y reintentar",
    "CodigoCreado -> Fin|Caso de uso finalizado",
    "Mostrando -> Fin|Usuario cierra el módulo"
]);
dictCU.Add("CU-25", cu25);

// ------------------------------------------------------------
// SUB PRINCIPAL
// ------------------------------------------------------------

function main() {

    var package = Repository.GetTreeSelectedPackage();

    if (package == null) {
        Session.Output("ERROR: Selecciona un Package en el Project Browser.");
        return;
    }

    var totalDiagramas = 0;

    var enumerador = new Enumerator(dictCU);
    for (; !enumerador.atEnd(); enumerador.moveNext()) {
        var cuKey = enumerador.item();
        var cuDict = dictCU.Item(cuKey);
        var diagramName = cuKey + " - " + cuDict.Item("nombre");
        var estados = cuDict.Item("estados");
        var transiciones = cuDict.Item("transiciones");

        if (crearDiagrama(package, diagramName, estados, transiciones)) {
            totalDiagramas = totalDiagramas + 1;
        }
    }

    Session.Output(" ");
    Session.Output("============================================");
    Session.Output(" TOTAL DIAGRAMAS CREADOS: " + totalDiagramas + " de " + dictCU.Count);
    Session.Output("============================================");
}

// ------------------------------------------------------------
// FUNCIÓN: CREAR DIAGRAMA DE ESTADO
// ------------------------------------------------------------

function crearDiagrama(package, diagramName, estados, transiciones) {

    var i, j, k, m, n;
    var estadoActual, transicionActual;
    var origen, destino, condicion;
    var posX, posY, ancho, alto;
    var elementoObj;

    // Crear el diagrama
    var diagram = package.Diagrams.AddNew(diagramName, "Activity");
    diagram.Update();

    // Diccionario para almacenar los elementos creados (por nombre)
    var elementosMap = new ActiveXObject("Scripting.Dictionary");

    // Crear nodo inicial (si existe "Inicio" en la lista de estados)
    var inicioExiste = false;
    for (i = 0; i < estados.length; i++) {
        if (estados[i] == "Inicio") {
            inicioExiste = true;
            break;
        }
    }

    if (inicioExiste) {
        elementoObj = crearNodoInicial(package);
        elementosMap.Add("Inicio", elementoObj);
    }

    // Crear nodo final (si existe "Fin" en la lista de estados)
    var finExiste = false;
    for (j = 0; j < estados.length; j++) {
        if (estados[j] == "Fin") {
            finExiste = true;
            break;
        }
    }

    if (finExiste) {
        elementoObj = crearNodoFinal(package);
        elementosMap.Add("Fin", elementoObj);
    }

    // Crear acciones para el resto de estados (excluyendo Inicio y Fin)
    for (k = 0; k < estados.length; k++) {
        estadoActual = estados[k];
        if (estadoActual != "Inicio" && estadoActual != "Fin") {
            elementoObj = crearAccion(package, estadoActual);
            elementosMap.Add(estadoActual, elementoObj);
        }
    }

    // Agregar los elementos al diagrama con posiciones automáticas:
    // cuadrícula vertical, cada estado en una fila separada 70px
    for (m = 0; m < estados.length; m++) {
        estadoActual = estados[m];
        if (elementosMap.Exists(estadoActual)) {
            elementoObj = elementosMap.Item(estadoActual);
            posX = 200;
            posY = 50 + m * 70;
            ancho = 150;
            alto = 40;
            agregarElemento(diagram, elementoObj, posX, posY, posX + ancho, posY + alto);
        }
    }

    // Crear flujos (conexiones) entre elementos
    for (n = 0; n < transiciones.length; n++) {
        transicionActual = transiciones[n];

        // Extraer origen, destino y condicion del formato "origen -> destino|condicion"
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

            if (elementosMap.Exists(origen) && elementosMap.Exists(destino)) {
                crearFlujo(elementosMap.Item(origen), elementosMap.Item(destino), condicion);
            } else {
                Session.Output("ADVERTENCIA: No se encontró origen o destino en " + diagramName + " para: " + transicionActual);
            }
        } else {
            Session.Output("ADVERTENCIA: Formato inválido en " + diagramName + ": " + transicionActual);
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

function trim(str) {
    return str.replace(/^\s+|\s+$/g, "");
}

function crearAccion(package, nombre) {
    var elemento = package.Elements.AddNew(nombre, "Action");
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

function crearFlujo(origen, destino, condicion) {
    var conector = origen.Connectors.AddNew("", "ControlFlow");
    conector.SupplierID = destino.ElementID;
    conector.Update();

    if (condicion != "") {
        conector.TransitionGuard = condicion;
        conector.Update();
    }
}

// ============================================================
// EJECUTAR
// ============================================================

main();