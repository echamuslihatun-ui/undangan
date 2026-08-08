import assert from "node:assert/strict";
import test from "node:test";
import { optionalInstagram } from "../src/lib/input";
import { getClientIp, getRateLimitIdentifier, checkRateLimit, cleanupRateLimitStore } from "../src/lib/rate-limit";

test("optionalInstagram menerima username polos", () => {
  assert.equal(optionalInstagram("johndoe"), "johndoe");
  assert.equal(optionalInstagram("@jane_doe"), "jane_doe");
  assert.equal(optionalInstagram("user.name_123"), "user.name_123");
});

test("optionalInstagram menerima URL Instagram dan mengekstrak username", () => {
  assert.equal(optionalInstagram("https://instagram.com/johndoe"), "johndoe");
  assert.equal(optionalInstagram("https://www.instagram.com/jane_doe/"), "jane_doe");
  assert.equal(optionalInstagram("https://instagr.am/user123"), "user123");
  assert.equal(optionalInstagram("www.instagram.com/plain"), "plain");
});

test("optionalInstagram menolak URL asing dan input tidak valid", () => {
  assert.equal(optionalInstagram("https://facebook.com/johndoe"), null);
  assert.equal(optionalInstagram("https://evil.com/instagram.com/johndoe"), null);
  assert.equal(optionalInstagram("https://instagram.com/"), null);
  assert.equal(optionalInstagram(""), null);
  assert.equal(optionalInstagram(null), null);
  assert.equal(optionalInstagram(undefined), null);
  assert.equal(optionalInstagram("user name with space"), null);
  assert.equal(optionalInstagram("a".repeat(31)), null);
});

test("getClientIp memprioritaskan x-vercel-forwarded-for", () => {
  const req = new Request("https://example.com", {
    headers: {
      "x-vercel-forwarded-for": "203.0.113.5",
      "x-forwarded-for": "1.2.3.4, 203.0.113.5",
    },
  });
  assert.equal(getClientIp(req), "203.0.113.5");
});

test("getClientIp memakai IP paling kanan dari x-forwarded-for (anti-spoofing)", () => {
  // Klien memalsukan IP kiri; yang benar adalah IP paling kanan (dari proxy tepercaya).
  const req = new Request("https://example.com", {
    headers: {
      "x-forwarded-for": "1.2.3.4, 203.0.113.5",
    },
  });
  assert.equal(getClientIp(req), "203.0.113.5");
});

test("getClientIp fallback ke x-real-ip", () => {
  const req = new Request("https://example.com", {
    headers: { "x-real-ip": "198.51.100.7" },
  });
  assert.equal(getClientIp(req), "198.51.100.7");
});

test("getClientIp mengembalikan unknown bila tidak ada header", () => {
  const req = new Request("https://example.com");
  assert.equal(getClientIp(req), "unknown");
});

test("getRateLimitIdentifier menggabungkan tipe dan IP", () => {
  const req = new Request("https://example.com", {
    headers: { "x-real-ip": "198.51.100.7" },
  });
  assert.equal(getRateLimitIdentifier(req, "rsvp"), "rsvp:198.51.100.7");
});

test("checkRateLimit membatasi setelah melewati max", () => {
  cleanupRateLimitStore();
  const id = "test:limit";
  const options = { windowMs: 60_000, max: 3 };

  assert.equal(checkRateLimit(id, options).limited, false);
  assert.equal(checkRateLimit(id, options).limited, false);
  assert.equal(checkRateLimit(id, options).limited, false);
  const limited = checkRateLimit(id, options);
  assert.equal(limited.limited, true);
  assert.equal(limited.count, 3);
  assert.ok(limited.resetIn > 0);
});

test("checkRateLimit mereset setelah window berakhir", () => {
  cleanupRateLimitStore();
  const id = "test:reset";
  const options = { windowMs: 10, max: 1 };

  assert.equal(checkRateLimit(id, options).limited, false);
  assert.equal(checkRateLimit(id, options).limited, true);

  // Tunggu window kedaluwarsa, lalu pastikan bisa request lagi.
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      assert.equal(checkRateLimit(id, options).limited, false);
      resolve();
    }, 20);
  });
});