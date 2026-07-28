import { describe, expect, it } from "vitest";
import speakeasy from "speakeasy";

describe("2FA Authenticator Utilities", () => {
  it("generates and verifies TOTP codes correctly", () => {
    const secretObj = speakeasy.generateSecret({ length: 20 });
    const base32Secret = secretObj.base32;

    const token = speakeasy.totp({
      secret: base32Secret,
      encoding: "base32",
    });

    expect(token).toHaveLength(6);

    const valid = speakeasy.totp.verify({
      secret: base32Secret,
      encoding: "base32",
      token,
      window: 1,
    });

    expect(valid).toBe(true);

    const invalid = speakeasy.totp.verify({
      secret: base32Secret,
      encoding: "base32",
      token: "000000",
      window: 0,
    });

    expect(invalid).toBe(false);
  });
});
