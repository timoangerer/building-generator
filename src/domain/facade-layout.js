function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function allocateZoneHeights(totalHeight, facade) {
  const zones = facade?.zones || [];
  const fixedHeight = zones.reduce((sum, zone) => sum + (zone.height || 0), 0);
  const flexZones = zones.filter((zone) => zone.flex);
  const remaining = Math.max(0.1, totalHeight - fixedHeight);
  const flexUnits = flexZones.reduce((sum, zone) => sum + zone.flex, 0) || 1;

  return zones.map((zone) => ({
    ...zone,
    resolvedHeight: zone.height || (remaining * zone.flex) / flexUnits,
  }));
}

export function planRows(zone, width, height, floorHeight) {
  const rows = [];
  let cursorY = 0;

  for (const row of zone.rows || []) {
    if (row.repeatFloors) {
      const repeatCount = Math.max(1, Math.floor(height / (row.heightPerFloor || floorHeight)));
      const resolvedHeight = height / repeatCount;
      for (let index = 0; index < repeatCount; index += 1) {
        rows.push({
          ...row,
          key: `${zone.key}-floor-${index}`,
          resolvedHeight,
          y: cursorY + index * resolvedHeight,
          floorIndex: index,
        });
      }
      cursorY += height;
      continue;
    }

    const resolvedHeight = (row.height || 1) * height;
    rows.push({
      ...row,
      key: `${zone.key}-row-${rows.length}`,
      resolvedHeight,
      y: cursorY,
      floorIndex: 0,
    });
    cursorY += resolvedHeight;
  }

  return rows.map((row) => ({ ...row, width }));
}

export function fitRepeatItem(item, availableWidth) {
  const minWidth = item.minWidth || 1.2;
  const maxWidth = item.maxWidth || availableWidth;
  const gap = item.gap || 0.4;
  const count = Math.max(1, Math.floor((availableWidth + gap) / (minWidth + gap)));
  const totalGap = gap * Math.max(0, count - 1);
  const resolvedWidth = Math.min(maxWidth, (availableWidth - totalGap) / count);
  return Array.from({ length: count }, () => ({ ...item, resolvedWidth }));
}

export function buildRowLayout(row, width) {
  const sourceItems = row.items || [];
  const fixedItems = sourceItems.filter((item) => !item.repeatFit);
  const repeatGroups = sourceItems.filter((item) => item.repeatFit);

  const prepared = fixedItems.map((item) => ({
    ...item,
    resolvedWidth: clamp(
      item.width || item.widthRatio || 1.5,
      item.minWidth || 1,
      item.maxWidth || width
    ),
  }));

  const fixedWidth = prepared.reduce((sum, item) => sum + item.resolvedWidth, 0);
  const fixedGap = prepared.reduce(
    (sum, item, index) => sum + (index < prepared.length - 1 ? item.gap ?? 0.5 : 0),
    0
  );
  const repeatWeight = repeatGroups.reduce((sum, item) => sum + (item.widthRatio || 1), 0) || 1;
  const remainingWidth = Math.max(width * 0.25, width - fixedWidth - fixedGap - repeatGroups.length * 0.35);

  for (const item of repeatGroups) {
    const slotWidth = (remainingWidth * (item.widthRatio || 1)) / repeatWeight;
    prepared.push(...fitRepeatItem(item, slotWidth));
  }

  const totalGap = prepared.reduce(
    (sum, item, index) => sum + (index < prepared.length - 1 ? item.gap ?? 0.5 : 0),
    0
  );
  const totalWidth = prepared.reduce((sum, item) => sum + item.resolvedWidth, 0);
  const scale = totalWidth + totalGap > width ? width / (totalWidth + totalGap) : 1;

  let cursor = -(width / 2) + (width - (totalWidth + totalGap) * scale) / 2;
  return prepared.map((item, index) => {
    const resolvedWidth = item.resolvedWidth * scale;
    const positioned = {
      ...item,
      x: cursor + resolvedWidth / 2,
      width: resolvedWidth,
      index,
    };
    cursor += resolvedWidth + (item.gap ?? 0.5) * scale;
    return positioned;
  });
}

export function resolveElementHeight(item, rowHeight) {
  return Math.min(
    rowHeight * 0.74,
    item.type === "door" || item.type === "entry" ? rowHeight * 0.9 : rowHeight * 0.68
  );
}

export function buildFacadeLayout(wall, facade) {
  const zones = [];
  const components = new Map();
  let cursorY = 0;

  const registerComponent = (type, zoneKey) => {
    const key = type || "unknown";
    if (!components.has(key)) {
      components.set(key, { type: key, count: 0, zones: new Set() });
    }
    const entry = components.get(key);
    entry.count += 1;
    if (zoneKey) entry.zones.add(zoneKey);
  };

  for (const zone of allocateZoneHeights(wall.height, facade)) {
    const inset = zone.inset || 0;
    const contentWidth = Math.max(1.6, wall.width - 0.6 - inset * 2);
    const rows = planRows(zone, contentWidth, zone.resolvedHeight, wall.floorHeight).map((row) => {
      const rowCenterY = cursorY + row.y + row.resolvedHeight / 2;
      const items = buildRowLayout(row, row.width).map((item) => {
        const hasBalcony = Boolean(item.balcony && row.floorIndex % item.balcony.every === 0);
        registerComponent(item.type, zone.key);
        if (hasBalcony) registerComponent("balcony", zone.key);

        return {
          ...item,
          key: `${zone.key}-${row.key}-${item.type}-${item.index}`,
          absoluteY: cursorY + row.y,
          centerY: rowCenterY,
          visualHeight: resolveElementHeight(item, row.resolvedHeight),
          hasBalcony,
        };
      });

      return {
        ...row,
        absoluteY: cursorY + row.y,
        centerY: rowCenterY,
        items,
      };
    });

    zones.push({
      key: zone.key,
      y: cursorY,
      height: zone.resolvedHeight,
      inset,
      contentWidth,
      rows,
      ornaments: zone.ornaments || [],
    });
    cursorY += zone.resolvedHeight;
  }

  const componentList = [...components.values()]
    .map((entry) => ({
      ...entry,
      zones: [...entry.zones].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return {
    facadeName: facade?.name || "Custom",
    wall,
    zones,
    components: componentList,
    summary: {
      width: wall.width,
      height: wall.height,
      area: round(wall.width * wall.height),
      zoneCount: zones.length,
      rowCount: zones.reduce((sum, zone) => sum + zone.rows.length, 0),
      componentCount: componentList.reduce((sum, component) => sum + component.count, 0),
      uniqueComponentTypes: componentList.length,
    },
  };
}

export function createVerificationSnapshot(layout) {
  return {
    facade: layout.facadeName,
    wall: {
      side: layout.wall.side,
      width: round(layout.wall.width),
      height: round(layout.wall.height),
      floorHeight: round(layout.wall.floorHeight),
      floors: layout.wall.floors,
      previewDepth: round(layout.wall.previewDepth),
    },
    summary: layout.summary,
    zones: layout.zones.map((zone) => ({
      key: zone.key,
      y: round(zone.y),
      height: round(zone.height),
      inset: round(zone.inset),
      contentWidth: round(zone.contentWidth),
      rows: zone.rows.map((row) => ({
        key: row.key,
        y: round(row.absoluteY),
        height: round(row.resolvedHeight),
        floorIndex: row.floorIndex,
        items: row.items.map((item) => ({
          key: item.key,
          type: item.type,
          x: round(item.x),
          centerY: round(item.centerY),
          width: round(item.width),
          visualHeight: round(item.visualHeight),
          header: item.header || null,
          sill: Boolean(item.sill),
          balcony: item.hasBalcony ? item.balcony : null,
        })),
      })),
      ornaments: zone.ornaments.map((ornament) => ({
        type: ornament.type,
        size: round(ornament.size),
        offsetY: round(ornament.offsetY),
      })),
    })),
    components: layout.components.map((component) => ({
      type: component.type,
      count: component.count,
      zones: component.zones,
    })),
  };
}

export function createVerificationReport(layout) {
  const lines = [
    `Facade ${layout.facadeName}`,
    `Wall ${round(layout.wall.width)}m x ${round(layout.wall.height)}m on ${layout.wall.side}`,
    `Floors ${layout.wall.floors} at ${round(layout.wall.floorHeight)}m each`,
    `Preview depth ${round(layout.wall.previewDepth)}m`,
    `Zones ${layout.summary.zoneCount}, rows ${layout.summary.rowCount}, component instances ${layout.summary.componentCount}`,
    "",
    "Zones",
  ];

  for (const zone of layout.zones) {
    lines.push(
      `- ${zone.key}: y=${round(zone.y)} height=${round(zone.height)} inset=${round(zone.inset)} contentWidth=${round(
        zone.contentWidth
      )}`
    );
    for (const row of zone.rows) {
      const manifest = row.items.map((item) => item.type).join(", ");
      lines.push(
        `  row ${row.floorIndex} at y=${round(row.absoluteY)} h=${round(row.resolvedHeight)} -> ${manifest || "empty"}`
      );
    }
    if (zone.ornaments.length) {
      lines.push(
        `  ornaments ${zone.ornaments
          .map((ornament) => `${ornament.type}@${round(ornament.offsetY)}(${round(ornament.size)})`)
          .join(", ")}`
      );
    }
  }

  lines.push("");
  lines.push("Components");
  for (const component of layout.components) {
    lines.push(`- ${component.type}: ${component.count} on ${component.zones.join(", ") || "none"}`);
  }

  return lines.join("\n");
}
