export async function createPngIco(
  entries: Array<{ size: number; blob: Blob }>,
) {
  const payloads = await Promise.all(
    entries.map(
      async (entry) => new Uint8Array(await entry.blob.arrayBuffer()),
    ),
  );
  const directorySize = 6 + entries.length * 16;
  const totalSize =
    directorySize + payloads.reduce((sum, payload) => sum + payload.length, 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);
  let offset = directorySize;
  entries.forEach((entry, index) => {
    const start = 6 + index * 16;
    view.setUint8(start, entry.size === 256 ? 0 : entry.size);
    view.setUint8(start + 1, entry.size === 256 ? 0 : entry.size);
    view.setUint8(start + 2, 0);
    view.setUint8(start + 3, 0);
    view.setUint16(start + 4, 1, true);
    view.setUint16(start + 6, 32, true);
    view.setUint32(start + 8, payloads[index].length, true);
    view.setUint32(start + 12, offset, true);
    new Uint8Array(buffer, offset, payloads[index].length).set(payloads[index]);
    offset += payloads[index].length;
  });
  return new Blob([buffer], { type: "image/x-icon" });
}
