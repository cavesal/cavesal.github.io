/**
 * CaVeSal® Calculadora Prenatal — exportar el resultado a PDF y Word.
 * Full: pide datos opcionales (nombre o iniciales, notas), arma el informe con
 * el resultado tal como lo muestra la calculadora y lo exporta.
 * Demo: los botones aparecen con candado y abren la información de la versión completa.
 * Todo queda en el dispositivo; nada se envía a ningún servidor.
 */
(function () {
  "use strict";
  var me = document.currentScript;
  var DEMO = ((me && me.getAttribute("data-mode")) || "full") === "demo";

  function $(id) { return document.querySelector("#" + id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hoy() { var d = new Date(); return d.toLocaleDateString("es-PY") + " " + d.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" }); }

  var css = "" +
    ".cvx-bar{margin:14px 0 6px;padding:14px;border-radius:14px;background:#fff;border:1.5px solid #b9dfe6}" +
    ".cvx-bar h4{margin:0 0 4px;font-size:.9rem;color:#0b3c5d}" +
    ".cvx-bar p{margin:0 0 10px;font-size:.76rem;color:#4a6274;line-height:1.4}" +
    ".cvx-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
    ".cvx-b{display:flex;align-items:center;justify-content:center;gap:6px;border:1.5px solid #0e7490;background:#fff;color:#0b3c5d;border-radius:10px;padding:11px 10px;font-weight:700;font-size:.84rem;cursor:pointer;font-family:inherit}" +
    ".cvx-b.main{background:#0e7490;color:#fff}" +
    ".cvx-lock{opacity:.75}" +
    "#cvx-modal{position:fixed;inset:0;z-index:99990;background:rgba(13,27,45,.6);display:none;align-items:center;justify-content:center;padding:16px}" +
    "#cvx-modal.open{display:flex}" +
    "#cvx-modal .bx{background:#fff;border-radius:16px;max-width:420px;width:100%;padding:18px;font-family:inherit}" +
    "#cvx-modal h3{margin:0 0 4px;font-size:1rem;color:#0b3c5d}" +
    "#cvx-modal .nt{font-size:.74rem;color:#64748b;margin:0 0 12px}" +
    "#cvx-modal label{display:block;font-size:.74rem;font-weight:700;color:#334155;margin:8px 0 4px}" +
    "#cvx-modal input,#cvx-modal textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:9px 10px;font:inherit;font-size:.88rem}" +
    "#cvx-modal textarea{min-height:60px;resize:vertical}" +
    "#cvx-modal .ac{display:flex;gap:8px;margin-top:14px}" +
    "#cvx-modal .ac button{flex:1}" +
    "#cvx-print{display:none}" +
    "@media print{body.cvx-printing>*:not(#cvx-print){display:none!important}body.cvx-printing #cvx-print{display:block!important}body.cvx-printing{background:#fff!important}#cvx-print,#cvx-print *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}";

  function injectCSS() { var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }

  window.cvsExportBar = function () {
    var L = DEMO ? " 🔒" : "";
    if (!DEMO) setTimeout(function () {
      var n = guardarUltimoResultado();
      var nt = document.querySelector("#cvx-ficha");
      if (n && nt) { nt.textContent = "Este resultado quedó guardado en la ficha de " + n + " (Pacientes)."; nt.style.display = "block"; }
    }, 0);
    return '<div class="cvx-bar" data-cvx="1"><h4>Guardar este resultado</h4>' +
      "<p>" + (DEMO ? "Exportar el resultado a PDF o Word para docencia o análisis posterior está en la versión completa."
        : "Exportá el resultado completo a PDF o Word, con los datos de la paciente que quieras agregar, para docencia o análisis posterior.") + "</p>" +
      '<p id="cvx-ficha" style="display:none;color:#0e7490;font-weight:700"></p>' +
      '<div class="cvx-row"><button type="button" class="cvx-b main' + (DEMO ? " cvx-lock" : "") + '" onclick="cvsExportar(\'pdf\')">Exportar PDF' + L + "</button>" +
      '<button type="button" class="cvx-b' + (DEMO ? " cvx-lock" : "") + '" onclick="cvsExportar(\'word\')">Exportar Word' + L + "</button></div></div>";
  };

  var PEND = null;
  function modal() {
    var m = $("cvx-modal");
    if (m) return m;
    m = document.createElement("div");
    m.id = "cvx-modal";
    m.innerHTML = '<div class="bx" role="dialog" aria-modal="true" aria-label="Datos para el informe"><h3>Datos para el informe</h3>' +
      '<p class="nt">Todo es opcional. Queda solo en el archivo que exportes.</p>' +
      '<label for="cvx-nombre">Nombre o iniciales</label><input id="cvx-nombre" autocomplete="off">' +
      '<label for="cvx-notas">Notas del caso</label><textarea id="cvx-notas"></textarea>' +
      '<div class="ac"><button type="button" class="cvx-b" data-x="no">Cancelar</button><button type="button" class="cvx-b main" data-x="si">Exportar</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener("click", function (e) {
      if (e.target === m) return m.classList.remove("open");
      var b = e.target.closest("[data-x]"); if (!b) return;
      m.classList.remove("open");
      if (b.getAttribute("data-x") === "si" && PEND) PEND({ nombre: $("cvx-nombre").value.trim(), notas: $("cvx-notas").value.trim() });
    });
    return m;
  }

  function contenido(pac) {
    var edad = $("edad") && $("edad").value ? $("edad").value : "";
    var d = [];
    if (pac.nombre) d.push("<b>Paciente:</b> " + esc(pac.nombre));
    if (edad) d.push("<b>Edad:</b> " + esc(edad) + " años");
    return '<div style="font-family:Arial,sans-serif;color:#000">' +
      '<h1 style="font-size:16pt;margin:0 0 2px;color:#0b3c5d">CaVeSal® Calculadora Prenatal — Resultado</h1>' +
      '<div style="font-size:9pt;color:#444;margin-bottom:10px">Generado: ' + esc(hoy()) + " · cavesal.app</div>" +
      '<div style="border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;margin-bottom:12px;font-size:10pt">' +
      (d.join(" · ") || "Sin datos de identificación") + (pac.notas ? '<div style="margin-top:4px"><b>Notas:</b> ' + esc(pac.notas) + "</div>" : "") + "</div>" +
      limpiarResultado() +
      '<p style="font-size:8.5pt;color:#555;margin-top:14px">Herramienta de apoyo a la decisión clínica para profesionales de la salud. No reemplaza el juicio clínico ni las guías oficiales. Algoritmos propios CaVeSal® basados en las fuentes citadas en la app.</p></div>';
  }

  function nombreArchivo(pac) {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    var id = (pac.nombre || "caso").replace(/[^\wáéíóúñÁÉÍÓÚÑ]+/g, "-").slice(0, 30);
    return "CaVeSal-Prenatal_" + id + "_" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes());
  }

  function pdf(pac) {
    var p = $("cvx-print");
    if (!p) { p = document.createElement("div"); p.id = "cvx-print"; document.body.appendChild(p); }
    p.innerHTML = contenido(pac);
    document.body.classList.add("cvx-printing");
    var fin = function () { document.body.classList.remove("cvx-printing"); window.removeEventListener("afterprint", fin); };
    window.addEventListener("afterprint", fin);
    setTimeout(function () { window.print(); setTimeout(fin, 1500); }, 60);
  }

  function word(pac) {
    var estilos = "";
    document.querySelectorAll("style").forEach(function (s) { estilos += s.textContent + "\n"; });
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>CaVeSal Prenatal</title><style>' +
      estilos + "body{font-family:Arial,sans-serif;font-size:11pt;background:#fff}</style></head><body>" + contenido(pac) + "</body></html>";
    var blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nombreArchivo(pac) + ".doc";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  window.cvsExportar = function (tipo) {
    if (DEMO) { if (typeof window.abrirContacto === "function") window.abrirContacto(); return; }
    if (!$("results") || !$("results").innerHTML.trim()) { alert("Primero presioná Calcular para tener un resultado."); return; }
    var m = modal();
    PEND = function (pac) { if (tipo === "pdf") pdf(pac); else word(pac); };
    m.classList.add("open");
    setTimeout(function () { $("cvx-nombre").focus(); }, 50);
  };


  /* ================= Pacientes (solo Full) ================= */
  var VIS = [["fecha","Fecha"],["eg","EG"],["peso","Peso (kg)"],["pa","PA"],["hb","Hb"],["gluc","Glucemia"],["tsh","TSH"],["pfe","PFE (g)"],["pfe_p","PFE pc"],["cx","Cérvix (mm)"],["present","Presentación"],["doppler","Doppler"],["obs","Observaciones"],["proxima","Próxima cita"]];
  var pacCalc = null;

  function limpiarResultado() {
    var r = $("results"); if (!r) return "";
    var c = r.cloneNode(true);
    c.querySelectorAll("[data-cvx], button, script, .ia-mz").forEach(function (e) {
      var box = e.classList && e.classList.contains("ia-mz") ? e.parentElement : e;
      if (box && box.parentElement) box.remove();
    });
    return c.innerHTML;
  }

  function guardarUltimoResultado() {
    if (!pacCalc || typeof window.getPacientes !== "function" || typeof window.savePacientes !== "function") return null;
    var pacs = window.getPacientes();
    var i = pacs.findIndex(function (x) { return x._id === pacCalc; });
    if (i < 0) return null;
    pacs[i].ultimoResultado = { fecha: new Date().toISOString(), html: limpiarResultado() };
    try { window.savePacientes(pacs); } catch (e) { return null; }
    return pacs[i].nombre;
  }

  function fechaLarga(iso) {
    try { var d = new Date(iso); return d.toLocaleDateString("es-PY") + " " + d.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; }
  }

  function informePaciente(p) {
    var eg = typeof window.calcEGTexto === "function" ? window.calcEGTexto(p.fum_corr || p.fum) : "";
    var fpp = p.fum ? new Date(new Date(p.fum).getTime() + 280 * 86400000).toLocaleDateString("es-PY") : "—";
    var fila = function (l, v) { return v ? "<tr><td style=\"padding:3px 8px;color:#475569;width:38%\">" + esc(l) + "</td><td style=\"padding:3px 8px\"><b>" + esc(v) + "</b></td></tr>" : ""; };
    var h = '<div style="font-family:Arial,sans-serif;color:#000">' +
      '<h1 style="font-size:16pt;margin:0 0 2px;color:#0b3c5d">CaVeSal® Calculadora Prenatal — Informe de la paciente</h1>' +
      '<div style="font-size:9pt;color:#444;margin-bottom:10px">Generado: ' + esc(hoy()) + " · cavesal.app</div>" +
      '<h2 style="font-size:12pt;color:#0e7490;margin:10px 0 4px">Datos de la paciente</h2>' +
      '<table style="border-collapse:collapse;width:100%;font-size:10pt;border:1px solid #cbd5e1">' +
      fila("Nombre", p.nombre) + fila("N.º de HC", p.id_hc) + fila("Fecha de nacimiento", p.nacimiento) + fila("Teléfono", p.tel) +
      fila("FUM", p.fum) + fila("FUM corregida", p.fum_corr) + fila("EG actual", eg) + fila("FPP (sem 40)", fpp) +
      fila("Fórmula obstétrica", "G" + (p.g || 0) + " P" + (p.p || 0) + " C" + (p.c || 0) + " A" + ((parseInt(p.ae) || 0) + (parseInt(p.ap) || 0))) +
      fila("Talla / peso pregestacional", (p.talla || "—") + " cm / " + (p.peso_preg || "—") + " kg") + fila("Grupo y Rh", p.rh) +
      fila("Riesgo", p.riesgo ? p.riesgo.toUpperCase() : "") + fila("Antecedentes obstétricos", p.ant) + fila("Patologías", p.patol) + fila("Notas", p.notas) +
      "</table>";
    if (typeof window.renderDatosHC === "function" && p.datosHC && Object.keys(p.datosHC).length) {
      try { h += '<div style="margin-top:10px">' + window.renderDatosHC(p.datosHC) + "</div>"; } catch (e) {}
    }
    var vs = (p.visitas || []).slice().sort(function (a, b) { return String(a.fecha || "").localeCompare(String(b.fecha || "")); });
    h += '<h2 style="font-size:12pt;color:#0e7490;margin:14px 0 4px">Historial de visitas (' + vs.length + ")</h2>";
    if (!vs.length) h += '<p style="font-size:10pt;color:#555">Sin visitas registradas.</p>';
    vs.forEach(function (v, n) {
      h += '<div style="border:1px solid #cbd5e1;border-radius:8px;padding:6px 10px;margin-bottom:6px;font-size:9.5pt;break-inside:avoid"><b>Visita ' + (n + 1) + (v.fecha ? " — " + esc(v.fecha) : "") + "</b><br>" +
        VIS.filter(function (k) { return k[0] !== "fecha" && v[k[0]]; }).map(function (k) { return "<span style=\"color:#475569\">" + esc(k[1]) + ":</span> " + esc(v[k[0]]); }).join(" · ") + "</div>";
    });
    h += '<h2 style="font-size:12pt;color:#0e7490;margin:14px 0 4px">Último resultado calculado</h2>';
    if (p.ultimoResultado && p.ultimoResultado.html) {
      h += '<div style="font-size:9pt;color:#444;margin-bottom:6px">Calculado: ' + esc(fechaLarga(p.ultimoResultado.fecha)) + "</div>" + p.ultimoResultado.html;
    } else {
      h += '<p style="font-size:10pt;color:#555">Todavía no hay un resultado guardado para esta paciente. Abrila en la calculadora y presioná Calcular.</p>';
    }
    h += '<p style="font-size:8.5pt;color:#555;margin-top:14px">Herramienta de apoyo a la decisión clínica para profesionales de la salud. No reemplaza el juicio clínico ni las guías oficiales. Algoritmos propios CaVeSal® basados en las fuentes citadas en la app.</p></div>';
    return h;
  }

  function salida(html, tipo, nombre) {
    if (tipo === "pdf") {
      var p = $("cvx-print");
      if (!p) { p = document.createElement("div"); p.id = "cvx-print"; document.body.appendChild(p); }
      p.innerHTML = html;
      document.body.classList.add("cvx-printing");
      var fin = function () { document.body.classList.remove("cvx-printing"); window.removeEventListener("afterprint", fin); };
      window.addEventListener("afterprint", fin);
      setTimeout(function () { window.print(); setTimeout(fin, 1500); }, 60);
    } else {
      var estilos = "";
      document.querySelectorAll("style").forEach(function (s) { estilos += s.textContent + "\n"; });
      var doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>CaVeSal Prenatal</title><style>' +
        estilos + "body{font-family:Arial,sans-serif;font-size:11pt;background:#fff}</style></head><body>" + html + "</body></html>";
      var blob = new Blob(["\ufeff" + doc], { type: "application/msword" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = nombre + ".doc";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }
  }

  window.cvsExportarPaciente = function (id, tipo) {
    var p = (window.getPacientes ? window.getPacientes() : []).find(function (x) { return x._id === id; });
    if (!p) return;
    salida(informePaciente(p), tipo, nombreArchivo({ nombre: p.nombre }).replace("CaVeSal-Prenatal_", "CaVeSal-Prenatal_Paciente_"));
  };

  function tarjetaPaciente(id) {
    var p = (window.getPacientes ? window.getPacientes() : []).find(function (x) { return x._id === id; });
    if (!p) return "";
    var ur = p.ultimoResultado && p.ultimoResultado.fecha ? "Incluye el último resultado calculado (" + esc(fechaLarga(p.ultimoResultado.fecha)) + ")." :
      "Todavía no hay un resultado guardado: abrila en la calculadora y presioná Calcular para sumarlo al informe.";
    return '<div class="cvx-bar" data-cvx="1" id="cvx-pac-bar"><h4>Informe de la paciente</h4><p>Datos fijos, todas las visitas y el último resultado. ' + ur + "</p>" +
      '<div class="cvx-row"><button type="button" class="cvx-b main" onclick="cvsExportarPaciente(\'' + id + '\',\'pdf\')">Exportar PDF</button>' +
      '<button type="button" class="cvx-b" onclick="cvsExportarPaciente(\'' + id + '\',\'word\')">Exportar Word</button></div></div>';
  }

  function engancharPacientes() {
    if (DEMO) return;
    var oCargar = window.cargarPacienteEnFormulario;
    if (typeof oCargar === "function" && !oCargar.__cvx) {
      var w1 = function (id) { pacCalc = id; return oCargar.apply(this, arguments); };
      w1.__cvx = true; window.cargarPacienteEnFormulario = w1;
    }
    var oVer = window.verDetallePaciente;
    if (typeof oVer === "function" && !oVer.__cvx) {
      var w2 = function (id) {
        var r = oVer.apply(this, arguments);
        var det = document.querySelector("#pac_detalle");
        if (det && !det.querySelector("#cvx-pac-bar")) det.insertAdjacentHTML("beforeend", tarjetaPaciente(id));
        return r;
      };
      w2.__cvx = true; window.verDetallePaciente = w2;
    }
  }

  function init() { injectCSS(); engancharPacientes(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
