import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// One-shot asset generator for the navbar/footer wordmark.
//
// public/logo.png is the full crest: 1024x1536 portrait, ratio 0.635. At a 32px
// navbar height it would render only ~20px wide, so the crest cannot be the
// horizontal mark. The crest contains a black bar near the top holding the
// "CLASH / SOCCER" wordmark; cropping to that bar gives a wide mark that still
// reads at small sizes.
//
// The bar's exact bounds were measured from the pixels, not guessed:
//   solid black rows 261..523, black columns 108..914
//   white glyphs inside it span x 151..871, y 299..490
// so the crop below leaves 43px of black on the left and right and 37/33px on
// top and bottom. Nothing is clipped, and no crest fragment (the red/green
// ribbon above, the helmet below) enters the mark.
//
// The height stops at 522 rather than 523: row 523 is the anti-aliased top edge
// of the white shield stroke below the bar, and including it leaves a faint 1px
// grey sliver along the bottom edge.

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const sourcePath = join(rootDir, "public", "logo.png");
const outputPath = join(rootDir, "public", "logo-mark.png");

// Crop straight to the inner black bar. Because the crop is already exactly the
// bar, no trim() is needed — and trim() would be wrong here, since it would cut
// back to the white glyphs and drop the black field the mark sits on.
const CROP = { left: 108, top: 261, width: 807, height: 262 };

let sharp;
try {
  // sharp ships as an optional dependency of next, not a direct dependency,
  // so resolve it lazily and fail with a readable message if it is absent.
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error("Cannot find the 'sharp' module.");
  console.error(
    "sharp is an optional dependency of next; run `npm install` (or `npm ci`) first."
  );
  console.error("This script only regenerates public/logo-mark.png; the committed");
  console.error("image means the rest of the project does not need sharp.");
  process.exit(1);
}

async function main() {
  const { data, info } = await sharp(sourcePath)
    .extract(CROP)
    .png()
    .toBuffer({ resolveWithObject: true });

  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(data).toFile(outputPath);

  const ratio = info.width / info.height;
  console.log(`Wrote ${outputPath}`);
  console.log(`${info.width}x${info.height} ratio=${ratio.toFixed(2)}`);
}

try {
  await main();
} catch (error) {
  console.error(
    `Failed to generate the logo mark: ${error instanceof Error ? error.message : error}`
  );
  process.exit(1);
}
