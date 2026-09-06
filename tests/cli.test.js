import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  existsSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve("bin/coordiation-cms.js");
test("npm initializer creates an independent clean project and refuses existing paths", () => {
  const dir = mkdtempSync(join(tmpdir(), "cms-init-"));
  try {
    const target = join(dir, "my-site");
    const result = spawnSync(process.execPath, [cli, "init", target], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const pkg = JSON.parse(readFileSync(join(target, "package.json")));
    assert.equal(pkg.private, true);
    assert.equal(pkg.name, "my-site");
    assert.ok(pkg.dependencies["@coordiation/fullstack"]);
    assert.ok(existsSync(join(target, "src/server/database.js")));
    assert.ok(existsSync(join(target, "public/fonts/OFL.txt")));
    for (const path of [
      ".env",
      "data",
      ".coordiation",
      "node_modules",
      "docs/promotion",
      ".npmrc",
    ])
      assert.equal(existsSync(join(target, path)), false, path);
    writeFileSync(join(target, "keep.txt"), "untouched");
    assert.notEqual(
      spawnSync(process.execPath, [cli, "init", target]).status,
      0,
    );
    assert.equal(readFileSync(join(target, "keep.txt"), "utf8"), "untouched");
    symlinkSync(join(dir, "missing"), join(dir, "link"));
    assert.notEqual(
      spawnSync(process.execPath, [cli, "init", join(dir, "link")]).status,
      0,
    );
    assert.notEqual(
      spawnSync(process.execPath, [
        cli,
        "init",
        join(dir, "another"),
        "--force",
      ]).status,
      0,
    );
    assert.equal(existsSync(join(dir, "another")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
