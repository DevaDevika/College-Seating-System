import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DB_NAME = "college-seating-db";
const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);

    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";

    const onData = (char) => {
      if (char === "\u0003") {
        process.stdout.write("\nCancelled.\n");
        process.exit(1);
      }

      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
        return;
      }

      if (char === "\u007f" || char === "\b") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }

      value += char;
    };

    stdin.on("data", onData);
  });
}

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);

  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );

  return [
    "pbkdf2",
    ITERATIONS,
    base64url(salt),
    base64url(derivedKey),
  ].join("$");
}

function sqlString(value) {
  return "'" + value.replaceAll("'", "''") + "'";
}

const username = (await new Promise((resolve) => {
  process.stdout.write("Enter admin username: ");
  process.stdin.once("data", (data) => resolve(data.toString().trim()));
})).trim();

if (!username) {
  console.error("Username cannot be empty.");
  process.exit(1);
}

const password = await askHidden("Enter admin password: ");

if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const passwordHash = hashPassword(password);

const sql = `
INSERT INTO admins (username, password_hash)
VALUES (${sqlString(username)}, ${sqlString(passwordHash)});
`;

const tempFile = path.join(os.tmpdir(), `college-seating-admin-${Date.now()}.sql`);

try {
  fs.writeFileSync(tempFile, sql, { encoding: "utf8" });

  execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "wrangler",
      "d1",
      "execute",
      DB_NAME,
     "--local",
      "--file",
      tempFile,
    ],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      shell: true,
    }
  );

  console.log("\n✅ Admin account created successfully.");
  console.log(`Username: ${username}`);
} catch (error) {
  console.error("\n❌ Could not create the admin account.");
  console.error("\nActual error:");
  console.error(error);
  process.exitCode = 1;
}