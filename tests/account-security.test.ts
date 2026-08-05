import assert from "node:assert/strict";
import test from "node:test";
import { createAuthToken, hashAuthToken, isValidEmail, normalizeEmail, validatePassword } from "../src/lib/account-security";
import { createCsv, parseCsv } from "../src/lib/csv";

test("normalisasi dan validasi email", () => {
  assert.equal(normalizeEmail("  USER@Example.COM  "), "user@example.com");
  assert.equal(isValidEmail("user@example.com"), true);
  assert.equal(isValidEmail("bukan-email"), false);
});

test("password wajib cukup kuat", () => {
  assert.equal(validatePassword("pendek1"), "Password minimal 8 karakter");
  assert.equal(validatePassword("tanpaangka"), "Password harus mengandung huruf dan angka");
  assert.equal(validatePassword("aman1234"), null);
});

test("token mentah acak dan hanya hash deterministik yang disimpan", () => {
  const first = createAuthToken();
  const second = createAuthToken();
  assert.notEqual(first.rawToken, second.rawToken);
  assert.notEqual(first.rawToken, first.tokenHash);
  assert.equal(hashAuthToken(first.rawToken), first.tokenHash);
  assert.equal(first.tokenHash.length, 64);
});

test("CSV tamu aman untuk koma, kutip, dan format Excel", () => {
  const csv = createCsv([{ Nama: 'Ani, "Nia"', WhatsApp: "08123456789" }]);
  assert.deepEqual(parseCsv(csv), [{ Nama: 'Ani, "Nia"', WhatsApp: "08123456789" }]);
});