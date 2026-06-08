/**
 * Join collection_items with modules and drop rows whose content no longer exists.
 */
export function enrichCollectionItems(collectionItems = [], modulesMap = {}) {
  return collectionItems
    .map((item) => ({
      ...item,
      module: modulesMap[item.content_id] || null,
    }))
    .filter((item) => item.module != null)
}

export function countValidCollectionItems(collectionItems = [], modulesMap = {}) {
  return collectionItems.filter((item) => modulesMap[item.content_id]).length
}

export function getOrphanedCollectionItemIds(collectionItems = [], modulesMap = {}) {
  return collectionItems.filter((item) => !modulesMap[item.content_id]).map((item) => item.id)
}
