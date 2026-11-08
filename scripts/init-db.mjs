import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const result = spawnSync(process.execPath, [join(__dirname, "migrate.mjs")], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
