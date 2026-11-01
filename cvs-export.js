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
    return '<div class="cvx-bar" data-cvx="1"><h4>Guardar este resultado</h4>' +
      "<p>" + (DEMO ? "Exportar el resultado a PDF o Word para docencia o análisis posterior está en la versión completa."
        : "Exportá el resultado completo a PDF o Word, con los datos de la paciente que quieras agregar, para docencia o análisis posterior.") + "</p>" +
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
    var r = $("results");
    var c = r.cloneNode(true);
    c.querySelectorAll("[data-cvx], button, script, .ia-mz").forEach(function (e) {
      var box = e.classList && e.classList.contains("ia-mz") ? e.parentElement : e;
      if (box && box.parentElement) box.remove();
    });
    var edad = $("edad") && $("edad").value ? $("edad").value : "";
    var d = [];
    if (pac.nombre) d.push("<b>Paciente:</b> " + esc(pac.nombre));
    if (edad) d.push("<b>Edad:</b> " + esc(edad) + " años");
    return '<div style="font-family:Arial,sans-serif;color:#000">' +
      '<h1 style="font-size:16pt;margin:0 0 2px;color:#0b3c5d">CaVeSal® Calculadora Prenatal — Resultado</h1>' +
      '<div style="font-size:9pt;color:#444;margin-bottom:10px">Generado: ' + esc(hoy()) + " · cavesal.app</div>" +
      '<div style="border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;margin-bottom:12px;font-size:10pt">' +
      (d.join(" · ") || "Sin datos de identificación") + (pac.notas ? '<div style="margin-top:4px"><b>Notas:</b> ' + esc(pac.notas) + "</div>" : "") + "</div>" +
      c.innerHTML +
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectCSS); else injectCSS();
})();
