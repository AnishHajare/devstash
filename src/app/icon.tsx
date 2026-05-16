import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const imperialScript = fs.readFileSync(
  path.join(
    process.cwd(),
    "node_modules/@fontsource/imperial-script/files/imperial-script-latin-400-normal.woff"
  )
);

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0e",
          color: "#ffffff",
          fontFamily: "Imperial Script",
          fontSize: 30,
          paddingBottom: 4,
        }}
      >
        ds
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Imperial Script",
          data: imperialScript,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
