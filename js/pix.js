/*
 * Gera o "Pix Copia e Cola" (BR Code estático) seguindo o padrão EMV
 * do Banco Central. Tudo roda no navegador: nenhum dado sai da página.
 */
(function (global) {
  'use strict';

  function field(id, value) {
    var len = String(value.length);
    if (len.length < 2) len = '0' + len;
    return id + len + value;
  }

  // CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF)
  function crc16(str) {
    var crc = 0xffff;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
      }
    }
    var hex = crc.toString(16).toUpperCase();
    while (hex.length < 4) hex = '0' + hex;
    return hex;
  }

  // Nome e cidade: só letras maiúsculas sem acento, números e espaço
  function clean(text, max) {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '')
      .trim()
      .slice(0, max);
  }

  function payload(opts) {
    var account = field('00', 'br.gov.bcb.pix') + field('01', opts.key);
    var p =
      field('00', '01') +
      field('26', account) +
      field('52', '0000') +
      field('53', '986') +
      (opts.amount > 0 ? field('54', opts.amount.toFixed(2)) : '') +
      field('58', 'BR') +
      field('59', clean(opts.name, 25)) +
      field('60', clean(opts.city, 15)) +
      field('62', field('05', opts.txid || '***')) +
      '6304';
    return p + crc16(p);
  }

  global.Pix = { payload: payload, crc16: crc16 };
})(typeof window !== 'undefined' ? window : globalThis);
