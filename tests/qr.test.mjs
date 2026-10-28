// Comprueba que los QR generados se leen con un lector independiente (OpenCV).
// Si el ordenador no tiene Python con OpenCV, la prueba se omite (no falla).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generarQR } from '../js/qr.js';

let hayOpenCV = false;
try { execFileSync('python3', ['-c', 'import cv2'], { stdio: 'ignore' }); hayOpenCV = true; } catch { /* sin OpenCV */ }

function aPGM(m, ruta) {
  const esc = 8; const mg = 4; const tam = (m.length + mg * 2) * esc;
  const px = Buffer.alloc(tam * tam, 255);
  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      const my = Math.floor(y / esc) - mg; const mx = Math.floor(x / esc) - mg;
      if (my >= 0 && mx >= 0 && my < m.length && mx < m.length && m[my][mx]) px[y * tam + x] = 0;
    }
  }
  writeFileSync(ruta, Buffer.concat([Buffer.from(`P5 ${tam} ${tam} 255\n`), px]));
}

test('Los QR de las ubicaciones se leen correctamente', { skip: !hayOpenCV && 'Python + OpenCV no disponible' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'qr-'));
  const textos = [
    'https://ieslacimurga.github.io/inventario-gimnasio/#/ubicacion/EST-A1',
    'https://ieslacimurga.github.io/inventario-gimnasio/#/ubicacion/BURRO-A',
    'https://ejemplo.github.io/una-ruta-bastante-larga/#/ubicacion/ESTANTERIA-PRINCIPAL-DEL-FONDO-CAJA-12',
    'Almacén → Estantería A → Caja 2 · ñ',
  ];
  try {
    textos.forEach((t, i) => aPGM(generarQR(t), join(dir, `qr${i}.pgm`)));
    const salida = execFileSync('python3', ['-I', '-c', `
import cv2, sys, json
d = cv2.QRCodeDetector()
print(json.dumps([d.detectAndDecode(cv2.imread(sys.argv[1] + '/qr%d.pgm' % i, 0))[0] for i in range(${textos.length})]))
`, dir]).toString();
    assert.deepEqual(JSON.parse(salida), textos);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('El tamaño del QR crece con la longitud del texto', () => {
  assert.equal(generarQR('a').length, 21);
  assert.ok(generarQR('x'.repeat(200)).length > 45);
  assert.throws(() => generarQR('x'.repeat(3000)));
});
