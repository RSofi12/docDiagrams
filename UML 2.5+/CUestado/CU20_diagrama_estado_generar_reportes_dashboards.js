// ============================================================
// ENTERPRISE ARCHITECT
// DIAGRAMA DE ESTADO - CASO DE USO CU-20
// PROYECTO FASHIONSTORE
// CU20 - Generar reportes y dashboards
// LENGUAJE: JScript (Motor nativo en Enterprise Architect)
//
// IMPORTANTE: usa ARREGLOS planos (var + loop), el mismo patrón de los
// diagramas de secuencia que ya funcionan. NO usa Scripting.Dictionary
// ni Enumerator (no los resuelve el motor JScript de EA/VSA).
//
// Parámetros según UML 2.5: Estado inicial (StateNode subtype 100),
// Estado final (StateNode subtype 101), estados/acciones (Action) y
// transiciones (ControlFlow) con guardas (TransitionGuard: [condicion]).
// ============================================================

// ------------------------------------------------------------
// ESTRUCTURA DE DATOS: CASO DE USO CU-20
// (Índice i: CU_NOMBRES[i], CU_ESTADOS[i], CU_TRANSICIONES[i])
// ------------------------------------------------------------

var CU_NOMBRES = [
    "CU-20 - Generar reportes y dashboards"
];

var CU_ESTADOS = [
    ["Inicio", "Accediendo", "TiposMostrados", "FiltrosIngresados",
     "Consultando", "ReporteGenerado", "Visualizando",
     "Exportando", "Exportado", "Error", "Fin"]
];

var CU_TRANSICIONES = [
    [
        "Inicio -> Accediendo|Administrador accede al módulo de reportes y dashboards",
        "Accediendo -> TiposMostrados|Tipos de reporte mostrados (ventas, inventario, reservas)",
        "TiposMostrados -> FiltrosIngresados|Selecciona tipo de reporte y filtros (sucursal, producto, periodo)",
        "FiltrosIngresados -> Consultando|Consulta la información consolidada enviada",
        "Consultando -> ReporteGenerado|Información consolidada obtenida (GET /api/dashboard)",
        "Consultando -> Error|Sin datos para los filtros o fallo en la consulta",
        "ReporteGenerado -> Visualizando|Indicadores visuales del dashboard generados",
        "Visualizando -> Exportando|Decide exportar el reporte (opcional)",
        "Visualizando -> Fin|Administrador cierra el módulo de reportes",
        "Exportando -> Exportado|Archivo de exportación generado en el formato solicitado",
        "Exportando -> Error|Error al exportar el reporte",
        "Exportado -> Visualizando|Reporte conservado en pantalla tras la exportación",
        "Error -> FiltrosIngresados|Reintentar: corregir filtros y volver a consultar",
        "Exportado -> Fin|Caso de uso finalizado"
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
        if (crearDiagrama(package, CU_NOMBRES[i], CU_ESTADOS[i], CU_TRANSICIONES[i])) {
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
// FUNCIÓN: CREAR DIAGRAMA DE ESTADO
// ------------------------------------------------------------

function crearDiagrama(package, diagramName, estados, transiciones) {

    var i, k, m, n;
    var estadoActual, transicionActual;
    var origen, destino, condicion;
    var posX, posY, ancho, alto;
    var elementoObj;
    var nombre;

    // Crear el diagrama
    var diagram = package.Diagrams.AddNew(diagramName, "Activity");
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

    // Crear acciones para el resto de estados (excluyendo Inicio y Fin)
    for (k = 0; k < estados.length; k++) {
        estadoActual = estados[k];
        if (estadoActual != "Inicio" && estadoActual != "Fin") {
            elementosMap[estadoActual] = crearAccion(package, estadoActual);
        }
    }

    // Agregar los elementos al diagrama: cuadrícula vertical orientable
    for (m = 0; m < estados.length; m++) {
        estadoActual = estados[m];
        if (elementosMap[estadoActual] != undefined) {
            elementoObj = elementosMap[estadoActual];
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

        // Formato: "origen -> destino|condicion"
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
                crearFlujo(elementosMap[origen], elementosMap[destino], condicion);
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
// EJECUTAR (con captura de errores para depuración en EA)
// ============================================================

try {
    main();
} catch (err) {
    Session.Output("ERROR EN EL SCRIPT: " + err.message);
    Session.Prompt("Error al ejecutar el diagrama de estado: " + err.message, 0);
}