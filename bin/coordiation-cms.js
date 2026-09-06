#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const args = process.argv.slice(2);
const help = `Coordiation CMS ${pkg.version}\n\nUsage:\n  coordiation-cms init <new-directory>\n  coordiation-cms --version\n\nCreates a local CMS project without installing dependencies or starting a server.\nThe destination must not already exist. Requires Node.js 22.18 or newer.\n`;

try {
  if (args.length === 1 && ["--version", "-v"].includes(args[0])) {
    console.log(pkg.version);
  } else if (
    !args.length ||
    (args.length === 1 && ["--help", "-h"].includes(args[0]))
  ) {
    console.log(help);
  } else {
    if (
      args[0] !== "init" ||
      args.length !== 2 ||
      !args[1].trim() ||
      args[1].startsWith("-")
    )
      throw new Error(help);
    const destination = resolve(args[1]);
    let occupied = false;
    try {
      lstatSync(destination);
      occupied = true;
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    if (occupied)
      throw new Error(
        "Destination already exists. Choose a new directory; existing files are never overwritten.",
      );
    mkdirSync(dirname(destination), { recursive: true });
    mkdirSync(destination);
    const files = [
      "src",
      "public",
      "scripts",
      "coordiation.config.json",
      "Dockerfile",
      "compose.yaml",
      ".env.example",
      ".dockerignore",
      "README.md",
    ];
    for (const name of files)
      cpSync(join(root, name), join(destination, name), {
        recursive: true,
        force: false,
        errorOnExist: true,
      });
    mkdirSync(join(destination, "docs"));
    for (const name of [
      "DEPLOYMENT.md",
      "DESIGN-SYSTEM.md",
      "FEATURES.md",
      "SECURITY.md",
      "SEO-AND-AI.md",
      "THEMES.md",
      "ICON-MANIFEST.json",
    ])
      cpSync(join(root, "docs", name), join(destination, "docs", name), {
        errorOnExist: true,
        force: false,
      });
    if (existsSync(join(root, "LICENSE")))
      cpSync(join(root, "LICENSE"), join(destination, "LICENSE"));
    const project = {
      name:
        basename(destination)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/^-+/, "") || "my-cms",
      version: "0.1.0",
      private: true,
      type: "module",
      engines: pkg.engines,
      scripts: {
        dev: pkg.scripts.dev,
        build: pkg.scripts.build,
        start: pkg.scripts.start,
      },
      dependencies: pkg.dependencies,
    };
    writeFileSync(
      join(destination, "package.json"),
      JSON.stringify(project, null, 2) + "\n",
      { flag: "wx" },
    );
    writeFileSync(
      join(destination, ".gitignore"),
      "node_modules/\n.coordiation/\ndata/\n.env\n.env.*\n!.env.example\n*.tgz\n",
      { flag: "wx" },
    );
    console.log(
      `Created Coordiation CMS in ${destination}\n\nNext:\n  cd ${JSON.stringify(destination)}\n  npm install\n  npm run build\n  npm start\n\nOpen http://127.0.0.1:3118/login to create your administrator account.\nBefore deploying, configure your own domain and private environment settings; see docs/DEPLOYMENT.md.`,
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
