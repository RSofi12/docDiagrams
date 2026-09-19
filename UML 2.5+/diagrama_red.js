/* =================================================================================
 * PROYECTO: FashionStore - E-Commerce
 * DIAGRAMA: Diagrama de Red y Seguridad (Network & Infrastructure Diagram)
 * DESCRIPCIÓN: Modelo de arquitectura de red con segmentación formal (UML / Network):
 *              - Capa de Acceso: Actores (Cliente, Admin, Encargado, Cajero, Proveedor).
 *              - Capa Perimetral de Usuario: Router/Módem y Firewall ISP.
 *              - Capa WAN: Nube Internet (TCP/IP, SSL/TLS).
 *              - Capa Edge / Frontend: Servidor Web Vercel (CDN / SPA) y Dispositivos Móviles.
 *              - Perímetro DMZ: Firewall WAF / Perimetral (GCP Cloud Armor).
 *              - Fragmento DMZ (Red Perimetral): Servidor Backend FastAPI (GCP / Docker).
 *              - Perímetro VLAN Datos: Firewall Interno (ACL / Security Group).
 *              - Fragmento VLAN DATOS (Red Restringida): Servidor PostgreSQL (Neon.Tech).
 *              - Servicios Cloud Externos: Stripe, Cloudinary, Lucy VTON, Gemini AI.
 *
 * ENTORNO: Enterprise Architect 15.0+ / 16.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "Diagrama de Red - FashionStore";

function log(msg) {
    Session.Output("[Red-FashionStore] " + msg);
}

/**
 * Obtiene el paquete de destino en el Project Browser o lo crea si no existe.
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
 * Recrea el diagrama limpio (Tipo Deployment / Network).
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

    var diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Deployment");
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

/**
 * Agrega un elemento básico al diagrama.
 */
function addElement(pkg, diagram, name, type, stereotype, notes, l, r, t, b) {
    var el = pkg.Elements.AddNew(name, type);
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    if (notes && notes.length > 0) {
        el.Notes = notes;
    }
    el.Update();
    pkg.Elements.Refresh();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();

    return el;
}

/**
 * Agrega un elemento hijo (Artifact / ExecutionEnvironment) dentro de un elemento padre.
 */
function addChildElement(parentEl, diagram, name, type, stereotype, l, r, t, b) {
    var child = parentEl.Elements.AddNew(name, type);
    if (stereotype && stereotype.length > 0) {
        child.Stereotype = stereotype;
    }
    child.Update();
    parentEl.Elements.Refresh();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = child.ElementID;
    dObj.Update();

    return child;
}

/**
 * Agrega un conector con etiqueta de protocolo y tipo.
 */
function addLink(src, dst, label, type, stereotype) {
    var con = src.Connectors.AddNew(label, type || "CommunicationPath");
    con.SupplierID = dst.ElementID;
    if (stereotype && stereotype.length > 0) {
        con.Stereotype = stereotype;
    }
    con.Update();
    return con;
}

function main() {
    log("Iniciando generación del Diagrama de Red de FashionStore...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* =========================================================================
     * 1. CAPA DE USUARIOS Y ACTORES (Y = -30 .. -110)
     * ========================================================================= */
    var actCliente    = addElement(pkg, diagram, "Cliente", "Actor", "", "", 60, 140, -30, -110);
    var actAdmin      = addElement(pkg, diagram, "Administrador", "Actor", "", "", 180, 260, -30, -110);
    var actEncargado  = addElement(pkg, diagram, "Encargado de\nSucursal", "Actor", "", "", 300, 380, -30, -110);
    var actCajero     = addElement(pkg, diagram, "Cajero", "Actor", "", "", 420, 500, -30, -110);
    var actProveedor  = addElement(pkg, diagram, "Proveedor", "Actor", "", "", 540, 620, -30, -110);

    /* =========================================================================
     * 2. EQUIPO DE BORDE DE USUARIO Y FIREWALL ISP (Y = -150 .. -330)
     * ========================================================================= */
    var nodeRouter = addElement(
        pkg, diagram,
        "Router / Gateway\n(Red LAN / Wi-Fi del Usuario)",
        "Node", "device",
        "Dispositivo de acceso local y NAT para usuarios y tiendas.",
        230, 470, -150, -220
    );

    var nodeFWISP = addElement(
        pkg, diagram,
        "Firewall Perimetral\n(Proveedor ISP / WAN Gateway)",
        "Node", "firewall",
        "Filtrado inicial de paquetes y seguridad de capa de transporte.",
        240, 460, -260, -330
    );

    /* =========================================================================
     * 3. RED WAN / INTERNET (Y = -370 .. -460)
     * ========================================================================= */
    var nodeInternet = addElement(
        pkg, diagram,
        "INTERNET\n(Red WAN Pública)",
        "Node", "cloud",
        "Infraestructura global de telecomunicaciones con cifrado TLS 1.3.",
        250, 450, -370, -460
    );

    /* =========================================================================
     * 4. CAPA EDGE / FRONTEND Y CLIENTE MÓVIL (Y = -510 .. -700)
     * ========================================================================= */
    // Servidor Frontend Web (Vercel)
    var nodeFrontend = addElement(
        pkg, diagram,
        "Servidor Frontend Web\n<<Vercel - CDN Edge>>",
        "Node", "device",
        "Plataforma PaaS Serverless y CDN global para la aplicación web.",
        50, 330, -510, -700
    );
    addChildElement(nodeFrontend, diagram, "Angular App\n(TypeScript - SPA)", "Artifact", "artifact", 80, 300, -590, -670);

    // Dispositivo Móvil
    var nodeMobile = addElement(
        pkg, diagram,
        "Dispositivo Móvil\n<<Cliente Smartphone>>",
        "Node", "device",
        "Dispositivo móvil Android / iOS del cliente.",
        380, 670, -510, -700
    );
    addChildElement(nodeMobile, diagram, "App FashionStore\n(Flutter / Dart)", "Artifact", "artifact", 400, 515, -600, -670);
    addChildElement(nodeMobile, diagram, "Módulo Vestidor Virtual\n(ARCore / ARKit)", "Artifact", "artifact", 535, 650, -600, -670);

    /* =========================================================================
     * 5. PERÍMETRO DMZ (Firewall WAF / Cloud Armor) (Y = -740 .. -810)
     * ========================================================================= */
    var nodeFWDMZ = addElement(
        pkg, diagram,
        "Firewall WAF / Perímetro DMZ\n(GCP Cloud Armor / Ingress)",
        "Node", "firewall",
        "Inspección de paquetes HTTPS, protección Anti-DDoS y filtrado WAF.",
        230, 470, -740, -810
    );

    /* =========================================================================
     * 6. FRAGMENTO DE RED: ZONA DMZ (Red Perimetral - GCP VPC) (Y = -840 .. -1080)
     * ========================================================================= */
    // Boundary / Fragmento DMZ (se crea primero para quedar detrás en el z-order)
    var boundaryDMZ = addElement(
        pkg, diagram,
        "DMZ (Red Perimetral - GCP VPC / Subred Pública)",
        "Boundary", "",
        "Zona perimetral controlada para servicios públicos de backend.",
        140, 580, -840, -1080
    );

    var nodeBackend = addElement(
        pkg, diagram,
        "Servidor Backend\n<<GCP Cloud Run / Docker Container>>",
        "Node", "device",
        "Servidor de microservicios y APIs REST bajo contenedor seguro.",
        180, 540, -880, -1050
    );
    addChildElement(nodeBackend, diagram, "API REST FastAPI\n(Uvicorn / Python)", "Artifact", "artifact", 210, 350, -960, -1030);
    addChildElement(nodeBackend, diagram, "Módulo Autenticación\n(JWT / OAuth2)", "Artifact", "artifact", 370, 510, -960, -1030);

    /* =========================================================================
     * 7. PERÍMETRO VLAN DATOS (Firewall Interno / ACL) (Y = -1120 .. -1190)
     * ========================================================================= */
    var nodeFWData = addElement(
        pkg, diagram,
        "Firewall Interno\n(Perímetro VLAN Datos - ACL / Security Group)",
        "Node", "firewall",
        "Reglas de acceso estrictas: solo acepta conexiones en el puerto 5432 desde la IP del Backend.",
        210, 490, -1120, -1190
    );

    /* =========================================================================
     * 8. FRAGMENTO DE RED: ZONA VLAN DATOS (Red Restringida) (Y = -1220 .. -1430)
     * ========================================================================= */
    // Boundary / Fragmento VLAN Datos
    var boundaryVLAN = addElement(
        pkg, diagram,
        "VLAN DATOS (Subred Privada - Red Interna Restringida)",
        "Boundary", "",
        "Zona aislada sin acceso a Internet para máxima protección de la base de datos.",
        140, 580, -1220, -1430
    );

    var nodeDB = addElement(
        pkg, diagram,
        "Servidor de Base de Datos\n<<PostgreSQL 16 - Neon.Tech / Cloud SQL>>",
        "Node", "database",
        "Clúster PostgreSQL relacional seguro con cifrado en reposo y en tránsito.",
        180, 540, -1260, -1400
    );
    addChildElement(nodeDB, diagram, "Esquema FashionStore_DB\n(SQLAlchemy / Alembic)", "Artifact", "artifact", 220, 500, -1325, -1385);

    /* =========================================================================
     * 9. SERVICIOS CLOUD E IA EXTERNOS (Columna Derecha: X = 770 .. 1070)
     * ========================================================================= */
    var cloudStripe = addElement(
        pkg, diagram,
        "Pasarela de Pago\n<<Stripe API>>",
        "Node", "cloud",
        "Servicio PCI-DSS para procesamiento seguro de pagos con tarjeta.",
        770, 1050, -510, -600
    );

    var cloudCloudinary = addElement(
        pkg, diagram,
        "Cloudinary Media\n<<CDN & Storage API>>",
        "Node", "cloud",
        "Almacenamiento y optimización de imágenes de catálogo y prendas.",
        770, 1050, -640, -730
    );

    var cloudLucy = addElement(
        pkg, diagram,
        "Lucy VTON Service\n<<AR & Virtual Try-On API>>",
        "Node", "cloud",
        "Inferencia de IA y realidad aumentada para probador virtual.",
        770, 1050, -770, -860
    );

    var cloudGemini = addElement(
        pkg, diagram,
        "Servicio de IA Generativa\n<<Google Gemini API>>",
        "Node", "cloud",
        "Modelos de lenguaje para asistencia chatbot y recomendaciones.",
        770, 1050, -900, -990
    );

    /* =========================================================================
     * 10. CONEXIONES Y RUTAS DE COMUNICACIÓN (Protocolos de Red)
     * ========================================================================= */
    // Actores hacia Router
    addLink(actCliente,   nodeRouter, "LAN / Wi-Fi", "CommunicationPath", "");
    addLink(actAdmin,     nodeRouter, "LAN / Ethernet", "CommunicationPath", "");
    addLink(actEncargado, nodeRouter, "LAN / Ethernet", "CommunicationPath", "");
    addLink(actCajero,    nodeRouter, "LAN / Ethernet", "CommunicationPath", "");
    addLink(actProveedor, nodeRouter, "LAN / Wi-Fi", "CommunicationPath", "");

    // Router a Firewall ISP y hacia Internet
    addLink(nodeRouter, nodeFWISP, "Ethernet / Fibra", "CommunicationPath", "");
    addLink(nodeFWISP, nodeInternet, "TCP/IP", "CommunicationPath", "");

    // Internet hacia Frontend (Vercel) y Móvil
    addLink(nodeInternet, nodeFrontend, "HTTPS 443", "CommunicationPath", "");
    addLink(nodeInternet, nodeMobile,   "HTTPS 443", "CommunicationPath", "");

    // Frontend y Móvil hacia Pasarela Stripe (Checkout seguro)
    addLink(nodeFrontend, cloudStripe, "HTTPS 443 (checkout)", "CommunicationPath", "");
    addLink(nodeMobile,   cloudStripe, "HTTPS 443 (checkout)", "CommunicationPath", "");

    // Frontend y Móvil hacia Firewall DMZ
    addLink(nodeFrontend, nodeFWDMZ, "HTTPS 443 (API REST)", "CommunicationPath", "");
    addLink(nodeMobile,   nodeFWDMZ, "HTTPS 443 (API REST)", "CommunicationPath", "");

    // Firewall DMZ hacia Backend
    addLink(nodeFWDMZ, nodeBackend, "HTTPS 443 / Ingress", "CommunicationPath", "");

    // Backend hacia Firewall VLAN Datos y a Base de Datos
    addLink(nodeBackend, nodeFWData, "TCP 5432", "CommunicationPath", "");
    addLink(nodeFWData,  nodeDB,     "TCP 5432 (psycopg2 / TLS)", "CommunicationPath", "");

    // Conexiones hacia Servicios Cloud / IA Externos
    addLink(nodeBackend, cloudGemini,     "HTTPS 443 (API REST)", "CommunicationPath", "");
    addLink(nodeBackend, cloudLucy,       "HTTPS 443 (Inference API)", "CommunicationPath", "");
    addLink(nodeMobile,  cloudLucy,       "HTTPS 443 (AR Stream / Video)", "CommunicationPath", "");
    addLink(nodeBackend, cloudCloudinary, "HTTPS 443 (Media Upload)", "CommunicationPath", "");
    addLink(nodeFrontend, cloudCloudinary,"HTTPS 443 (CDN Media Fetch)", "CommunicationPath", "");
    addLink(nodeMobile,  cloudCloudinary, "HTTPS 443 (CDN Media Fetch)", "CommunicationPath", "");

    /* =========================================================================
     * 11. GUARDAR, REFRESCAR Y ABRIR DIAGRAMA
     * ========================================================================= */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama de Red '" + DIAGRAM_NAME + "' generado exitosamente.");
    Session.Prompt("¡Diagrama de Red de FashionStore generado con éxito en Enterprise Architect!", 0);
}

main();
