export const DEFAULTS = Object.freeze({ speed: 1, ripple: 1, steam: true, fit: 'cover', paused: false });

export function normalize(value = {}) {
  if (!value || typeof value !== 'object') value = {};
  const output = { ...DEFAULTS };
  for (const key of ['speed', 'ripple']) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) {
      output[key] = Math.max(0, Math.min(2, value[key]));
    }
  }
  for (const key of ['steam', 'paused']) {
    if (typeof value[key] === 'boolean') output[key] = value[key];
  }
  if (value.fit === 'contain' || value.fit === 'cover') output.fit = value.fit;
  return output;
}

export function wallpaperPatch(properties = {}) {
  const patch = {};
  for (const key of ['speed', 'ripple']) {
    const value = properties[key]?.value;
    if (typeof value === 'number' && Number.isFinite(value)) patch[key] = value;
  }
  for (const key of ['steam', 'paused']) {
    if (typeof properties[key]?.value === 'boolean') patch[key] = properties[key].value;
  }
  if (String(properties.fit?.value) === '0') patch.fit = 'cover';
  if (String(properties.fit?.value) === '1') patch.fit = 'contain';
  return patch;
}
