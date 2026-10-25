function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function sameSnapshot(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

/** Returns local entries whose latest same-user snapshot is finalized and unchanged. */
export function reviewedLocalEntriesToRemove(entries, reviewRows, userId, complete = false) {
  if (!complete || !userId || !Array.isArray(entries) || !Array.isArray(reviewRows)) return [];
  return entries.filter((entry) => {
    const sourceKey = `${userId}:${entry.key}`;
    const latest = reviewRows
      .filter((row) => row.source_key === sourceKey)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
    return latest && ['importado', 'rejeitado'].includes(latest.review_status) &&
      sameSnapshot(entry.value, latest.payload?.value);
  });
}