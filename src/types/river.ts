export interface RiverWorkerRequest {
    id: number;
    width: number;
    height: number;
    bitmap: ImageBitmap;
}

export interface RiverWorkerResponse {
    id: number;
    data: Uint8ClampedArray;
}
