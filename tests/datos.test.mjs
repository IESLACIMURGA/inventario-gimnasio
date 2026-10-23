// Pruebas automáticas de la lógica de datos. Ejecutar desde la carpeta del proyecto:
//   node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsearCSV, csvAObjetos, aCSVExcel } from '../js/csv.js';
import {
  construirModelo, filtrar, ordenar, estadisticas, contenidoUbicacion,
  filasExportacion, urlImagenSegura, siNo, compararTallas, HOJAS,
} from '../js/datos.js';
import { urlHojaGoogle } from '../js/carga.js';

const demo = () => Object.fromEntries(HOJAS.map((h) => [h, csvAObjetos(readFileSync(new URL(`../datos/${h}.csv`, import.meta.url), 'utf8'))]));
const hojasMin = (extra = {}) => ({
  categorias: [{ _fila: 2, nombre: 'Ropa' }, { _fila: 3, nombre: 'Polos', padre: 'Ropa' }],
  estados: [{ _fila: 2, nombre: 'Disponible', disponible: 'sí' }, { _fila: 3, nombre: 'Para lavar', disponible: 'no' }],
  ubicaciones: [{ _fila: 2, codigo: 'ALM', nombre: 'Almacén' }, { _fila: 3, codigo: 'B1', nombre: 'Burro 1', padre: 'ALM' }],
  materiales: [{ _fila: 2, codigo: 'P1', nombre: 'Polo negro', categoria: 'Polos' }],
  existencias: [],
  ...extra,
});

test('CSV: comillas, comas, saltos de línea, BOM y CRLF', () => {
  const t = '﻿a,b,c\r\n"uno, dos","con ""comillas""","línea\nnueva"\r\n\r\n';
  assert.deepEqual(parsearCSV(t), [['a', 'b', 'c'], ['uno, dos', 'con "comillas"', 'línea\nnueva']]);
});

test('CSV: cabeceras con acentos y espacios se normalizan', () => {
  const [o] = csvAObjetos('Código,Ubicación,Fotos extra\nX1,EST-A,a.jpg');
  assert.equal(o.codigo, 'X1'); assert.equal(o.ubicacion, 'EST-A'); assert.equal(o.fotos_extra, 'a.jpg'); assert.equal(o._fila, 2);
});

test('Los datos de ejemplo se cargan sin avisos', () => {
  const m = construirModelo(demo());
  assert.deepEqual(m.avisos, []);
  assert.equal(m.materiales.size, 14);
});

test('Cantidades por variante y estado (camiseta talla M: 2 disp., 1 para lavar, 2 sin estampar)', () => {
  const m = construirModelo(demo());
  const cam = m.materiales.get('rop-cam-ins');
  const tallaM = cam.porVariante.get('M');
  assert.equal(tallaM.total, 5);
  assert.equal(tallaM.disponibles, 2);
  assert.equal(tallaM.porEstado.get(m.estados.get('para lavar')), 1);
  assert.equal(tallaM.porEstado.get(m.estados.get('sin estampar')), 2);
  assert.equal(cam.total, 13);
  assert.equal(cam.disponibles, 10);
  assert.deepEqual(cam.variantes.map((v) => v.variante), ['S', 'M', 'L', 'XL']);
});

test('El material «para lavar» no cuenta como disponible', () => {
  const mod = construirModelo(hojasMin({ existencias: [
    { _fila: 2, material: 'P1', variante: 'M', ubicacion: 'B1', estado: 'Disponible', cantidad: '2' },
    { _fila: 3, material: 'P1', variante: 'M', ubicacion: 'B1', estado: 'Para lavar', cantidad: '3' },
  ] }));
  const p = mod.materiales.get('p1');
  assert.equal(p.total, 5); assert.equal(p.disponibles, 2);
});

test('Las cantidades repartidas entre ubicaciones suman el total', () => {
  const m = construirModelo(demo());
  const bal = m.materiales.get('bal-fut-01');
  const suma = bal.lineas.reduce((s, l) => s + l.cantidad, 0);
  assert.equal(bal.total, suma);
  assert.equal(bal.total, 12);
  assert.equal(bal.ubicaciones.size, 2);
});

test('Cantidades negativas, decimales o texto se rechazan con aviso', () => {
  const mod = construirModelo(hojasMin({ existencias: [
    { _fila: 2, material: 'P1', estado: 'Disponible', cantidad: '-3' },
    { _fila: 3, material: 'P1', estado: 'Disponible', cantidad: '2.5' },
    { _fila: 4, material: 'P1', estado: 'Disponible', cantidad: 'muchos' },
    { _fila: 5, material: 'P1', estado: 'Disponible', cantidad: '4' },
  ] }));
  assert.equal(mod.materiales.get('p1').total, 4);
  assert.equal(mod.avisos.length, 3);
  assert.match(mod.avisos[0], /fila 2/);
});

test('Estado desconocido: se avisa y no cuenta como disponible', () => {
  const mod = construirModelo(hojasMin({ existencias: [
    { _fila: 2, material: 'P1', estado: 'Roto', cantidad: '2' },
  ] }));
  const p = mod.materiales.get('p1');
  assert.equal(p.total, 2); assert.equal(p.disponibles, 0);
  assert.equal(mod.avisos.length, 1);
});

test('Filas repetidas se suman (no se duplican) y se avisa', () => {
  const mod = construirModelo(hojasMin({ existencias: [
    { _fila: 2, material: 'P1', variante: 'M', ubicacion: 'B1', estado: 'Disponible', cantidad: '2' },
    { _fila: 3, material: 'p1', variante: 'm', ubicacion: 'b1', estado: 'disponible', cantidad: '1' },
  ] }));
  const p = mod.materiales.get('p1');
  assert.equal(p.lineas.length, 1); assert.equal(p.total, 3); assert.equal(mod.avisos.length, 1);
});

test('Material o ubicación inexistentes en Existencias generan aviso', () => {
  const mod = construirModelo(hojasMin({ existencias: [
    { _fila: 2, material: 'NOEXISTE', estado: 'Disponible', cantidad: '2' },
    { _fila: 3, material: 'P1', ubicacion: 'Marte', estado: 'Disponible', cantidad: '2' },
  ] }));
  assert.equal(mod.avisos.length, 2);
  assert.equal(mod.materiales.get('p1').total, 2);
});

test('Se puede usar el nombre de la ubicación en vez del código', () => {
  const mod = construirModelo(hojasMin({ existencias: [{ _fila: 2, material: 'P1', ubicacion: 'Burro 1', estado: 'Disponible', cantidad: '2' }] }));
  assert.equal(mod.avisos.length, 0);
  assert.equal([...mod.materiales.get('p1').ubicaciones][0].codigo, 'B1');
});

test('Categorías: filtrar por la categoría padre incluye sus subcategorías', () => {
  const m = construirModelo(demo());
  const ropa = filtrar(m, { categoria: 'ropa' });
  assert.deepEqual(ropa.map((x) => x.codigo).sort(), ['ROP-CAM-INS', 'ROP-CHA-01', 'ROP-POL-NEG']);
  assert.equal(filtrar(m, { categoria: 'polos' }).length, 1);
});

test('Categoría desactivada oculta sus materiales y subcategorías', () => {
  const h = hojasMin({ existencias: [{ _fila: 2, material: 'P1', estado: 'Disponible', cantidad: '1' }] });
  h.categorias[0].activa = 'no';
  const mod = construirModelo(h);
  assert.equal(filtrar(mod, {}).length, 0);
  assert.equal(mod.categorias.get('polos').visible, false);
});

test('Ciclos de padres se detectan sin colgar la web', () => {
  const mod = construirModelo(hojasMin({
    ubicaciones: [{ _fila: 2, codigo: 'A', padre: 'B' }, { _fila: 3, codigo: 'B', padre: 'A' }],
  }));
  assert.ok(mod.avisos.some((a) => /ciclo/.test(a)));
});

test('Buscador: ignora acentos y mayúsculas, busca por talla, ubicación y código', () => {
  const m = construirModelo(demo());
  const cods = (q) => filtrar(m, { texto: q }).map((x) => x.codigo).sort();
  assert.deepEqual(cods('BALON futbol'), ['BAL-FUT-01']);
  assert.deepEqual(cods('burro a xl'), ['ROP-CAM-INS', 'ROP-POL-NEG']);
  assert.deepEqual(cods('jue-aje'), ['JUE-AJE-01']);
  assert.deepEqual(cods('caja 2'), ['DEP-ARO-01', 'DEP-CUE-01']);
  assert.deepEqual(cods('estantería a'), ['BAL-BAS-01', 'BAL-FUT-01', 'BAL-VOL-01']);
  assert.deepEqual(cods('xyzzy'), []);
});

test('Filtros por estado y disponibilidad', () => {
  const m = construirModelo(demo());
  const lavar = filtrar(m, { estado: 'para lavar' }).map((x) => x.codigo).sort();
  assert.deepEqual(lavar, ['ROP-CAM-INS', 'ROP-POL-NEG']);
  assert.equal(filtrar(m, { disponibilidad: 'no' }).length, 0);
  assert.equal(filtrar(m, { disponibilidad: 'si' }).length, 14);
});

test('Ordenación por nombre y por disponibles', () => {
  const m = construirModelo(demo());
  const az = ordenar(filtrar(m), 'nombre').map((x) => x.nombre);
  assert.equal(az[0], 'Ajedrez');
  assert.deepEqual(ordenar(filtrar(m), 'nombre-desc').map((x) => x.nombre), [...az].reverse());
  const disp = ordenar(filtrar(m), 'disponibles');
  assert.ok(disp[0].disponibles >= disp[1].disponibles);
});

test('Estadísticas calculadas desde las existencias', () => {
  const m = construirModelo(demo());
  const st = estadisticas(m);
  const esperado = [...m.materiales.values()].reduce((s, x) => s + x.lineas.reduce((a, l) => a + l.cantidad, 0), 0);
  assert.equal(st.unidades, esperado);
  assert.equal(st.materiales, 14);
  assert.equal(st.categoriasActivas, 5);
  assert.equal(st.porEstado.get(m.estados.get('para lavar')), 3);
});

test('Contenido de una ubicación incluye lo que hay en sus sububicaciones', () => {
  const m = construirModelo(demo());
  const estA = m.ubicaciones.get('est-a');
  assert.equal(contenidoUbicacion(estA, false).length, 0);
  assert.deepEqual(contenidoUbicacion(estA, true).map((g) => g.material.codigo).sort(), ['BAL-BAS-01', 'BAL-FUT-01', 'BAL-VOL-01']);
  const burro = contenidoUbicacion(m.ubicaciones.get('burro-a'));
  assert.equal(burro.find((g) => g.material.codigo === 'ROP-POL-NEG').total, 21);
});

test('Imágenes: solo rutas locales o https; enlaces de Drive convertidos', () => {
  assert.equal(urlImagenSegura('javascript:alert(1)'), null);
  assert.equal(urlImagenSegura('http://inseguro.com/a.jpg'), null);
  assert.equal(urlImagenSegura('data:image/png;base64,AAAA'), null);
  assert.equal(urlImagenSegura('../secreto.jpg'), null);
  assert.equal(urlImagenSegura('/abs.jpg'), null);
  assert.equal(urlImagenSegura('https://x.com/a.jpg" onerror="x'), null);
  assert.equal(urlImagenSegura('img/balón fútbol.jpg'), 'img/bal%C3%B3n%20f%C3%BAtbol.jpg');
  assert.equal(urlImagenSegura('https://ejemplo.org/foto.png'), 'https://ejemplo.org/foto.png');
  assert.equal(urlImagenSegura('https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view?usp=sharing'),
    'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMn&sz=w1200');
});

test('Exportación a Excel: BOM, punto y coma y sin inyección de fórmulas', () => {
  const csv = aCSVExcel([['a', 'b;c', '=HYPERLINK("x")'], ['-2', 'línea\n2', 'ok']]);
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes('"b;c"'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(csv.includes("'-2"));
  const m = construirModelo(demo());
  const filas = filasExportacion([m.materiales.get('rop-pol-neg')]);
  assert.equal(filas.length, 1 + 5);
  assert.equal(filas[1][2], 'Ropa › Polos');
});

test('Utilidades: sí/no y orden de tallas', () => {
  assert.equal(siNo('Sí'), true); assert.equal(siNo('NO'), false); assert.equal(siNo('', false), false);
  assert.deepEqual(['XL', 'S', '40', 'M', '38', 'XS'].sort(compararTallas), ['XS', 'S', 'M', 'XL', '38', '40']);
});

test('URL de Google Sheets publicada', () => {
  const u = urlHojaGoogle('https://docs.google.com/spreadsheets/d/e/2PACX-1vAbc_123/pub?output=csv', '987');
  assert.equal(u, 'https://docs.google.com/spreadsheets/d/e/2PACX-1vAbc_123/pub?gid=987&single=true&output=csv');
  assert.throws(() => urlHojaGoogle('https://docs.google.com/spreadsheets/d/ABC/edit', '0'));
  assert.throws(() => urlHojaGoogle('https://docs.google.com/spreadsheets/d/e/2PACX-1vAbc/pub', ''));
});

test('Buscador: una sola palabra corta busca en cualquier parte (mientras se escribe)', () => {
  const m = construirModelo(demo());
  assert.ok(filtrar(m, { texto: 'po' }).some((x) => x.codigo === 'ROP-POL-NEG'));
});
