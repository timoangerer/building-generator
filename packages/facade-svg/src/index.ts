import type { FacadeLayout } from "@green-buses/facade-core";

export interface RenderFacadeSvgOptions {
  width?: number;
  height?: number;
  padX?: number;
  padY?: number;
  includeAnnotations?: boolean;
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildSvgMarkup(layout: FacadeLayout, options: RenderFacadeSvgOptions = {}) {
  const viewWidth = options.width ?? 1200;
  const viewHeight = options.height ?? 860;
  const padX = options.padX ?? 88;
  const padY = options.padY ?? 52;
  const includeAnnotations = options.includeAnnotations ?? true;

  const wallWidth = viewWidth - padX * 2;
  const wallHeight = viewHeight - padY * 2;
  const scaleX = wallWidth / layout.wall.width;
  const scaleY = wallHeight / layout.wall.height;
  const centerX = viewWidth / 2;
  const wallBottom = viewHeight - padY;
  const wallLeft = centerX - wallWidth / 2;
  const wallTop = padY;
  const wallRight = wallLeft + wallWidth;

  const toX = (value: number): number => centerX + value * scaleX;
  const toY = (value: number): number => wallBottom - value * scaleY;
  const parts: string[] = [];

  parts.push(`
    <defs>
      <linearGradient id="wallFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#fff8ec" />
        <stop offset="100%" stop-color="#e7d8c1" />
      </linearGradient>
      <linearGradient id="glassFill" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#b8d3de" />
        <stop offset="100%" stop-color="#7ea4b5" />
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#4f3822" flood-opacity="0.14" />
      </filter>
    </defs>
  `);

  parts.push(
    `<rect x="${wallLeft}" y="${wallTop}" width="${wallWidth}" height="${wallHeight}" rx="28" fill="url(#wallFill)" stroke="rgba(80,61,41,0.24)" stroke-width="2" filter="url(#softShadow)" />`
  );

  for (const [index, zone] of layout.zones.entries()) {
    const zoneTop = toY(zone.y + zone.height);
    const zoneBottom = toY(zone.y);
    const contentX = toX(-zone.contentWidth / 2);
    const contentWidth = zone.contentWidth * scaleX;

    parts.push(
      `<rect x="${contentX}" y="${zoneTop}" width="${contentWidth}" height="${zoneBottom - zoneTop}" rx="18" fill="${
        index % 2 === 0 ? "rgba(255,255,255,0.18)" : "rgba(159,90,43,0.05)"
      }" stroke="rgba(80,61,41,0.08)" stroke-width="1" />`
    );

    if (includeAnnotations) {
      parts.push(
        `<text x="${wallLeft + 16}" y="${zoneTop + 24}" font-size="14" font-family="Avenir Next, Segoe UI, sans-serif" font-weight="700" fill="#7f4419">${escapeHtml(
          zone.key
        )}</text>`
      );
      parts.push(
        `<line x1="${wallLeft}" y1="${zoneTop}" x2="${wallRight}" y2="${zoneTop}" stroke="rgba(80,61,41,0.12)" stroke-width="1" />`
      );
    }

    for (const row of zone.rows) {
      for (const item of row.items) {
        const frameX = toX(item.x - item.width / 2);
        const frameWidth = item.width * scaleX;
        const frameHeight = item.visualHeight * scaleY;
        const frameY = toY(item.centerY) - frameHeight / 2;
        const itemFill = item.type === "door" || item.type === "entry" ? "#d0bfaa" : "#c5b097";
        const itemRadius = item.type === "oculus" ? frameWidth / 2 : 10;

        parts.push(
          `<rect x="${frameX}" y="${frameY}" width="${frameWidth}" height="${frameHeight}" rx="${itemRadius}" fill="${itemFill}" stroke="rgba(80,61,41,0.24)" stroke-width="1.5" />`
        );

        if (item.type === "window" || item.type === "glass") {
          parts.push(
            `<rect x="${frameX + frameWidth * 0.12}" y="${frameY + frameHeight * 0.11}" width="${
              frameWidth * 0.76
            }" height="${frameHeight * 0.78}" rx="7" fill="url(#glassFill)" opacity="${
              item.type === "glass" ? 0.95 : 0.88
            }" />`
          );
          if (item.sill) {
            parts.push(
              `<rect x="${frameX + frameWidth * 0.08}" y="${frameY + frameHeight * 0.92}" width="${
                frameWidth * 0.84
              }" height="5" rx="3" fill="#c5b097" />`
            );
          }
        } else if (item.type === "door" || item.type === "entry") {
          parts.push(
            `<rect x="${frameX + frameWidth * 0.14}" y="${frameY + frameHeight * 0.12}" width="${
              frameWidth * 0.72
            }" height="${frameHeight * 0.88}" rx="7" fill="#5c5349" />`
          );
          if (item.arch) {
            parts.push(
              `<path d="M ${frameX + frameWidth * 0.24} ${frameY + frameHeight * 0.3} A ${frameWidth * 0.26} ${
                frameHeight * 0.26
              } 0 0 1 ${frameX + frameWidth * 0.76} ${frameY + frameHeight * 0.3}" fill="none" stroke="#c5b097" stroke-width="6" stroke-linecap="round" />`
            );
          }
        } else if (item.type === "oculus") {
          parts.push(
            `<circle cx="${frameX + frameWidth / 2}" cy="${frameY + frameHeight / 2}" r="${
              Math.min(frameWidth, frameHeight) * 0.26
            }" fill="url(#glassFill)" />`
          );
        } else if (item.type === "screen") {
          for (let slat = -2; slat <= 2; slat += 1) {
            parts.push(
              `<rect x="${frameX + frameWidth / 2 + slat * frameWidth * 0.16 - 4}" y="${frameY + frameHeight * 0.08}" width="8" height="${
                frameHeight * 0.84
              }" rx="3" fill="#5c5349" />`
            );
          }
        }

        if (item.header === "lintel") {
          parts.push(
            `<rect x="${frameX - frameWidth * 0.05}" y="${frameY - 8}" width="${frameWidth * 1.1}" height="8" rx="4" fill="#c5b097" />`
          );
        } else if (item.header === "pediment") {
          parts.push(
            `<path d="M ${frameX + frameWidth * 0.08} ${frameY - 1} L ${frameX + frameWidth / 2} ${frameY - 18} L ${
              frameX + frameWidth * 0.92
            } ${frameY - 1} Z" fill="#c5b097" />`
          );
        } else if (item.header === "arch") {
          parts.push(
            `<path d="M ${frameX + frameWidth * 0.18} ${frameY + 2} A ${frameWidth * 0.32} ${
              frameHeight * 0.22
            } 0 0 1 ${frameX + frameWidth * 0.82} ${frameY + 2}" fill="none" stroke="#c5b097" stroke-width="6" stroke-linecap="round" />`
          );
        }

        if (item.hasBalcony) {
          const slabY = toY(item.centerY - item.visualHeight * 0.38);
          parts.push(
            `<rect x="${frameX + frameWidth * 0.04}" y="${slabY}" width="${frameWidth * 0.92}" height="12" rx="4" fill="#8a8d92" />`
          );
          parts.push(
            `<rect x="${frameX + frameWidth * 0.08}" y="${slabY - 18}" width="${frameWidth * 0.84}" height="4" fill="#5c5349" />`
          );
        }
      }
    }

    for (const ornament of zone.ornaments) {
      const ornamentY = toY(zone.y + ornament.offsetY);
      parts.push(
        `<rect x="${wallLeft}" y="${ornamentY - Math.max(2, ornament.size * scaleY * 0.5)}" width="${wallWidth}" height="${Math.max(
          4,
          ornament.size * scaleY
        )}" rx="4" fill="#c5b097" opacity="${ornament.type === "band" ? 0.74 : 0.92}" />`
      );
    }
  }

  if (includeAnnotations) {
    parts.push(
      `<text x="${centerX}" y="${padY - 16}" text-anchor="middle" font-size="18" font-family="Avenir Next, Segoe UI, sans-serif" font-weight="700" fill="#684329">${escapeHtml(
        `${layout.facadeName} facade`
      )}</text>`
    );
    parts.push(
      `<text x="${centerX}" y="${viewHeight - 16}" text-anchor="middle" font-size="13" font-family="Avenir Next, Segoe UI, sans-serif" fill="#6a5c4f">${escapeHtml(
        `${round(layout.wall.width)}m wide, ${round(layout.wall.height)}m tall`
      )}</text>`
    );
  }

  return { viewWidth, viewHeight, markup: parts.join("") };
}

export function renderFacadeSvg(
  svgElement: SVGSVGElement,
  layout: FacadeLayout,
  options: RenderFacadeSvgOptions = {}
): void {
  const { viewWidth, viewHeight, markup } = buildSvgMarkup(layout, options);
  svgElement.setAttribute("viewBox", `0 0 ${viewWidth} ${viewHeight}`);
  svgElement.innerHTML = markup;
}

export function createFacadeSvgString(layout: FacadeLayout, options: RenderFacadeSvgOptions = {}): string {
  const { viewWidth, viewHeight, markup } = buildSvgMarkup(layout, options);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" fill="none">${markup}</svg>`;
}
