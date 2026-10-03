/** Only the server's explicit unlinked response establishes a missing assignment. */
export async function readHousingLink(response: Response): Promise<boolean> {
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Housing lookup failed');
    const record = data as Record<string, unknown>;
    if (response.status === 404 && record.isUnlinked === true) return false;
    if (!response.ok || record.error) throw new Error('Housing lookup failed');
    return true;
}
