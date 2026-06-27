/**
 * Delete the IndexedDB 'shopping' database to ensure a clean state between test suites.
 * Uses fake-indexeddb which is loaded in the test-setup.
 */
export async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}
