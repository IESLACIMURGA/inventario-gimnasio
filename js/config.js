/* =====================================================================
   CONFIGURACIÓN — es el único archivo que hay que tocar para poner la
   web en marcha. Las instrucciones paso a paso están en el README.
   ===================================================================== */

export const CONFIG = {
  // Textos de la cabecera
  centro: 'IES Lacimurga',
  subtitulo: 'Constantia Iulia',
  titulo: 'Almacén del gimnasio',

  // Logo del instituto (opcional). Sube el archivo a la carpeta img/ con este nombre.
  // Si no existe, se muestra el nombre del centro en texto.
  logo: 'img/logo.png',

  // ¿De dónde salen los datos?
  //   'demo'   → archivos de ejemplo de la carpeta datos/ (para probar)
  //   'google' → tu hoja de Google Sheets publicada en la web
  fuente: 'demo',

  // Solo si fuente = 'google'.
  // 1) En la hoja: Archivo → Compartir → Publicar en la web → Documento completo → CSV → Publicar.
  // 2) Pega aquí el enlace que te da Google (el que termina en /pub?output=csv).
  googleUrlPublicada: '',
  // 3) El número "gid" de cada pestaña: haz clic en la pestaña y mira el final de la
  //    dirección del navegador (…#gid=123456789). La primera pestaña suele ser 0.
  googleGids: {
    materiales: '',
    existencias: '',
    categorias: '',
    estados: '',
    ubicaciones: '',
  },

  // Dirección pública de la web, usada en los códigos QR.
  // Déjala vacía para usar automáticamente la dirección desde la que se abre la página.
  // Rellénala (p. ej. 'https://evagr11.github.io/inventario-gimnasio/') antes de imprimir
  // etiquetas si las generas desde otra dirección (por ejemplo, desde tu ordenador).
  urlPublica: '',

  // Materiales por página en el listado
  porPagina: 15,
};
