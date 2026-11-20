// Prueba de punta a punta del Módulo 1 contra Supabase local (ver docs/02-modulo-1.md).
// Uso: node pruebas-e2e/modulo1.cjs <carpeta-para-capturas>
// eslint-disable-next-line @typescript-eslint/no-require-imports -- script de Node sin compilar
const { chromium } = require("playwright");
const BASE = "http://localhost:3000";
const MAIL = "http://127.0.0.1:54324/api/v1";
const OUT = process.argv[2];
const paso = (m) => console.log("✔", m);

async function enlaceDeCorreo(para) {
  for (let i = 0; i < 20; i++) {
    const lista = await (await fetch(`${MAIL}/messages`)).json();
    const msg = lista.messages.find((m) => m.To.some((t) => t.Address === para));
    if (msg) {
      const det = await (await fetch(`${MAIL}/message/${msg.ID}`)).json();
      const m = det.HTML.match(/href="([^"]+)"/);
      return { asunto: msg.Subject, enlace: m[1].replace(/&amp;/g, "&") };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No llegó correo a ${para}`);
}

async function ingresar(page, correo, clave) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Correo institucional").fill(correo);
  await page.getByLabel("Contraseña").fill(clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForLoadState("networkidle");
}

(async () => {
  const navegador = await chromium.launch();
  const movil = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };
  const admin = await (await navegador.newContext(movil)).newPage();
  const juez = await (await navegador.newContext(movil)).newPage();
  const errores = [];
  for (const p of [admin, juez]) p.on("pageerror", (e) => errores.push(e.message));

  // Login fallido
  await ingresar(admin, "admin@prueba.co", "mala");
  await admin.getByText("Correo o contraseña incorrectos").waitFor();
  paso("login con clave incorrecta muestra error genérico");

  await ingresar(admin, "admin@prueba.co", "clave-admin-segura-123");
  await admin.goto(`${BASE}/admin`);
  await admin.getByLabel("Correo del juez").fill("juez@prueba.co");
  await admin.getByRole("button", { name: "Enviar invitación" }).click();
  await admin.getByText("Invitación enviada a juez@prueba.co").waitFor();
  paso("admin invita al juez");

  for (const anio of ["2026", "2027"]) {
    await admin.getByLabel("Año").fill(anio);
    await admin.getByRole("button", { name: "Cargar festivos y vacancias" }).click();
    await admin.getByText(`Calendario ${anio}: 18 festivos y 2 suspensiones nuevas`).waitFor({ timeout: 20000 });
  }
  paso("admin carga calendario 2026 y 2027");

  const { asunto, enlace } = await enlaceDeCorreo("juez@prueba.co");
  paso(`correo recibido: "${asunto}"`);
  await juez.goto(enlace);
  await juez.waitForURL("**/cuenta/contrasena");
  await juez.getByLabel("Nombre completo").fill("Ana Pérez");
  await juez.getByLabel("Nueva contraseña").fill("clave-juez-segura-1");
  await juez.getByLabel("Repita la contraseña").fill("clave-juez-segura-1");
  await juez.getByRole("button", { name: "Guardar y continuar" }).click();
  await juez.waitForURL("**/onboarding");
  paso("juez acepta la invitación y crea su contraseña");

  await juez.getByLabel("Nombre del despacho").fill("Juzgado 1 Civil Municipal de Bogotá");
  await juez.getByLabel("Código del despacho").fill("110014003001");
  await juez.getByLabel("Especialidad").selectOption("civil");
  await juez.getByLabel("departamento").fill("Bogotá D.C.");
  await juez.getByLabel("municipio").fill("Bogotá");
  await juez.getByLabel("seccional").fill("Bogotá");
  await juez.screenshot({ path: `${OUT}/1-registro-despacho.png`, fullPage: true });
  await juez.getByRole("button", { name: "Solicitar registro" }).click();
  await juez.waitForURL("**/pendiente");
  await juez.goto(`${BASE}/tablero`);
  await juez.waitForURL("**/pendiente");
  paso("despacho queda pendiente y el tablero está bloqueado");

  await admin.goto(`${BASE}/admin`);
  await admin.getByText("Juzgado 1 Civil Municipal de Bogotá").waitFor();
  await admin.getByRole("button", { name: "Verificar" }).click();
  await admin.getByText(/Verificado el/).waitFor();
  paso("admin verifica el despacho");

  await juez.goto(`${BASE}/procesos/nuevo`);
  await juez.getByLabel("Radicado (23 dígitos)").fill("11001-40-03-001-2026-00123-00");
  await juez.getByLabel("Clase de proceso").fill("Tutela");
  await juez.getByRole("button", { name: "Crear proceso" }).click();
  await juez.waitForURL(/\/procesos\/[0-9a-f-]{36}$/);
  paso("juez crea un proceso");

  async function termino(tipo, fecha, esperado) {
    await juez.getByLabel("Tipo de término").selectOption(tipo);
    await juez.getByLabel("Fecha del evento").fill(fecha);
    await juez.getByRole("button", { name: "Registrar término" }).click();
    await juez.getByText(`Término registrado. Vence el ${esperado}.`).waitFor();
    paso(`${tipo} desde ${fecha} → vence ${esperado}`);
  }
  await termino("tutela_fallo", "2026-11-13", "2026-11-30");
  await termino("tutela_fallo", "2026-11-06", "2026-11-23");
  await termino("cgp121_primera_instancia", "2025-11-03", "2026-11-03");
  await termino("tutela_fallo", "2026-12-15", "2027-01-20");

  await juez.reload();
  await juez.getByText("Memoria de cálculo").first().click();
  await juez.screenshot({ path: `${OUT}/2-ficha-proceso.png`, fullPage: true });

  // Suspensión abierta en un término y luego reanudación
  const ultimo = juez.locator("article").filter({ hasText: "15 dic 2026" }).first();
  await ultimo.getByText("Registrar suspensión, interrupción o prórroga").click();
  await ultimo.getByLabel("Desde").fill("2026-12-16");
  await ultimo.getByLabel("Soporte").fill("Auto del 15-dic-2026");
  await ultimo.getByRole("button", { name: "Registrar novedad" }).click();
  await ultimo.getByText("Sin vencimiento (suspendido)").waitFor();
  paso("suspensión abierta deja el término suspendido");
  await ultimo.getByLabel("Reanudar: último día suspendido").fill("2026-12-17");
  await ultimo.getByRole("button", { name: "Reanudar" }).click();
  await juez.getByText("Vence el 22 ene 2027").waitFor();
  paso("al reanudar se recalcula (2 días hábiles más → 22 ene 2027)");

  await juez.goto(`${BASE}/tablero`);
  await juez.getByText("Términos activos").waitFor();
  await juez.screenshot({ path: `${OUT}/3-tablero.png`, fullPage: true });
  const texto = await juez.locator("main").innerText();
  for (const t of ["Vencido", "Crítico", "A tiempo"]) if (!texto.includes(t)) throw new Error(`Falta ${t} en el tablero`);
  paso("tablero muestra vencido, crítico y a tiempo");

  await juez.goto(`${BASE}/configuracion`);
  await juez.getByText("Equipo").first().waitFor();
  await juez.getByLabel("Correo").fill("sustanciador@prueba.co");
  await juez.getByRole("button", { name: "Invitar" }).click();
  await juez.getByText("Invitación enviada a sustanciador@prueba.co").waitFor();
  await enlaceDeCorreo("sustanciador@prueba.co");
  paso("juez invita a un sustanciador y llega el correo");
  await juez.screenshot({ path: `${OUT}/4-configuracion.png`, fullPage: true });

  // Escritorio
  await juez.setViewportSize({ width: 1280, height: 900 });
  await juez.goto(`${BASE}/tablero`);
  await juez.getByText("Términos activos").waitFor();
  await juez.screenshot({ path: `${OUT}/5-tablero-escritorio.png`, fullPage: true });

  if (errores.length) throw new Error(`Errores de JavaScript: ${errores.join(" | ")}`);
  paso("sin errores de JavaScript en el navegador");
  await navegador.close();
})().catch((e) => {
  console.error("✘", e.message);
  process.exit(1);
});
