import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../..");
const sw   = readFileSync(join(ROOT, "sw.js"), "utf8");

// Lista PRECACHE tal como está escrita en sw.js
const precache = [...sw.match(/const PRECACHE = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);

function jsFiles(dir) {
  return readdirSync(join(ROOT, dir)).flatMap(name => {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) return jsFiles(rel);
    return name.endsWith(".js") ? [rel] : [];
  });
}

describe("Service worker — precache", () => {
  it("incluye todos los módulos de js/ (para que la app abra sin señal)", () => {
    const esperados = jsFiles("js").filter(f =>
      f !== "js/firebase.config.example.js" && f !== "js/firebase.config.js");
    esperados.forEach(f => expect(precache, `falta ${f} en PRECACHE de sw.js`).toContain(f));
  });

  it("incluye el shell (html, css, manifest, ícono) y la config de Firebase", () => {
    ["./", "index.html", "styles.css", "manifest.webmanifest", "icon.svg", "js/firebase.config.js"]
      .forEach(f => expect(precache).toContain(f));
  });

  it("no lista archivos que no existen", () => {
    precache
      .filter(f => f !== "./" && f !== "js/firebase.config.js") // la config se genera en el deploy
      .forEach(f => expect(() => statSync(join(ROOT, f)), `${f} no existe`).not.toThrow());
  });
});

describe("Reglas de Firebase", () => {
  it("database.rules.json es JSON válido y exige auth en las salas", () => {
    const rules = JSON.parse(readFileSync(join(ROOT, "database.rules.json"), "utf8"));
    const room  = rules.rules.rooms.$roomCode;
    expect(room[".read"]).toContain("auth != null");
    expect(room[".write"]).toContain("auth != null");
    expect(rules.rules[".write"]).toBe(false);
  });
});
