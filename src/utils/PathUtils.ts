/**
 * Utility for resolving asset paths.
 * Handles base URL adjustments for deployment (e.g. GitHub Pages).
 */
export function resolvePath(path: string): string {
    // [OPTIONAL] Check for Vite base URL if running in a subdirectory
    // distinct from root. For now, we return the path as-is.
    // If you employ import.meta.env.BASE_URL, you can prepend it here.

    // Example:
    // const base = import.meta.env.BASE_URL || '/';
    // if (path.startsWith('/') && base !== '/') {
    //     return base + path.substring(1); 
    // }

    return path;
}
