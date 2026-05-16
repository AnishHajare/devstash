import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "DevStash — one hub for all your developer knowledge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const imperialScript = fs.readFileSync(
  path.join(
    process.cwd(),
    "node_modules/@fontsource/imperial-script/files/imperial-script-latin-400-normal.woff"
  )
);
const spaceGrotesk = fs.readFileSync(
  path.join(
    process.cwd(),
    "node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff"
  )
);
const inter = fs.readFileSync(
  path.join(
    process.cwd(),
    "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff"
  )
);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c0c0e",
          color: "#ffffff",
          padding: "84px 96px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
          <span
            style={{
              fontFamily: "Imperial Script",
              fontSize: 168,
              lineHeight: 0.85,
              letterSpacing: "-3px",
            }}
          >
            ds
          </span>
          <span
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: 76,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            devstash
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: 64,
              lineHeight: 1.08,
              letterSpacing: "-1.6px",
              maxWidth: 880,
            }}
          >
            One hub for all your developer knowledge.
          </div>
          <div
            style={{
              fontFamily: "Inter",
              fontSize: 26,
              color: "#a1a1aa",
              letterSpacing: "0.4px",
            }}
          >
            Snippets · prompts · commands · notes · links · files
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Imperial Script", data: imperialScript, style: "normal", weight: 400 },
        { name: "Space Grotesk", data: spaceGrotesk, style: "normal", weight: 700 },
        { name: "Inter", data: inter, style: "normal", weight: 400 },
      ],
    }
  );
}
