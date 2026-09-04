/**
 * WebGLTerrainRenderer.ts
 * GPU-accelerated Physical Terrain Hillshade & Hypsometric Tinting Renderer.
 * Replaces heavy CPU worker loops with WebGL Fragment Shaders (<0.3ms per tile).
 */

export interface TerrainRenderOptions {
    azimuth?: number;
    altitude?: number;
    zFactor?: number;
    shadowOpacity?: number;
    curvatureStrength?: number;
    useElevationColor?: boolean;
}

export class WebGLTerrainRenderer {
    private static instance: WebGLTerrainRenderer | null = null;
    private static supported: boolean | null = null;

    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private program: WebGLProgram;

    private posBuffer: WebGLBuffer;
    private demTexture: WebGLTexture;
    private lutTexture: WebGLTexture;

    // Uniform locations
    private uDemLoc: WebGLUniformLocation;
    private uLutLoc: WebGLUniformLocation;
    private uResolutionLoc: WebGLUniformLocation;
    private uLight1DirLoc: WebGLUniformLocation;
    private uLight2DirLoc: WebGLUniformLocation;
    private uZFactorLoc: WebGLUniformLocation;
    private uCurvatureLoc: WebGLUniformLocation;
    private uShadowOpacityLoc: WebGLUniformLocation;
    private uUseElevationColorLoc: WebGLUniformLocation;

    public static isSupported(): boolean {
        if (this.supported !== null) return this.supported;
        if (typeof document === "undefined") {
            this.supported = false;
            return false;
        }
        try {
            const testCanvas = document.createElement("canvas");
            const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
            this.supported = !!gl;
        } catch {
            this.supported = false;
        }
        return this.supported;
    }

    public static getInstance(): WebGLTerrainRenderer | null {
        if (!this.isSupported()) return null;
        if (!this.instance) {
            try {
                this.instance = new WebGLTerrainRenderer();
            } catch (err) {
                console.error("[WebGLTerrainRenderer] Failed to initialize WebGL:", err);
                this.supported = false;
                this.instance = null;
            }
        }
        return this.instance;
    }

    private constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 256;
        this.canvas.height = 256;

        const gl = this.canvas.getContext("webgl", {
            preserveDrawingBuffer: true,
            premultipliedAlpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            alpha: true,
        });

        if (!gl) {
            throw new Error("Unable to create WebGL context");
        }
        this.gl = gl;

        // Compile shaders
        this.program = this.initShaderProgram();
        gl.useProgram(this.program);

        // Attributes & Uniforms
        const posAttr = gl.getAttribLocation(this.program, "a_position");
        this.uDemLoc = gl.getUniformLocation(this.program, "u_dem")!;
        this.uLutLoc = gl.getUniformLocation(this.program, "u_lut")!;
        this.uResolutionLoc = gl.getUniformLocation(this.program, "u_resolution")!;
        this.uLight1DirLoc = gl.getUniformLocation(this.program, "u_light1Dir")!;
        this.uLight2DirLoc = gl.getUniformLocation(this.program, "u_light2Dir")!;
        this.uZFactorLoc = gl.getUniformLocation(this.program, "u_zFactor")!;
        this.uCurvatureLoc = gl.getUniformLocation(this.program, "u_curvatureStrength")!;
        this.uShadowOpacityLoc = gl.getUniformLocation(this.program, "u_shadowOpacity")!;
        this.uUseElevationColorLoc = gl.getUniformLocation(this.program, "u_useElevationColor")!;

        // Fullscreen Quad
        this.posBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        const quadVertices = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

        // Textures
        this.demTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.demTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.lutTexture = this.createHypsometricLutTexture();

        // Default viewport
        gl.viewport(0, 0, 256, 256);
    }

    private initShaderProgram(): WebGLProgram {
        const gl = this.gl;
        const vsSource = "attribute vec2 a_position;\nvarying vec2 v_uv;\nvoid main() {\n    v_uv = (a_position + 1.0) * 0.5;\n    gl_Position = vec4(a_position, 0.0, 1.0);\n}";
        const fsSource = "precision mediump float;\nvarying vec2 v_uv;\n\nuniform sampler2D u_dem;\nuniform sampler2D u_lut;\nuniform vec2 u_resolution;\nuniform vec3 u_light1Dir;\nuniform vec3 u_light2Dir;\nuniform float u_zFactor;\nuniform float u_curvatureStrength;\nuniform float u_shadowOpacity;\nuniform float u_useElevationColor;\n\n// Terrarium elevation decode: elev = (R * 256 + G + B / 256) - 32768\nfloat decodeElev(vec4 c) {\n    return dot(c.rgb, vec3(65280.0, 255.0, 0.99609375)) - 32768.0;\n}\n\nvoid main() {\n    vec2 step = 1.0 / u_resolution;\n\n    // 8-neighborhood elevation samples\n    float e_tl = decodeElev(texture2D(u_dem, v_uv + vec2(-step.x,  step.y)));\n    float e_tc = decodeElev(texture2D(u_dem, v_uv + vec2( 0.0,     step.y)));\n    float e_tr = decodeElev(texture2D(u_dem, v_uv + vec2( step.x,  step.y)));\n\n    float e_ml = decodeElev(texture2D(u_dem, v_uv + vec2(-step.x,  0.0)));\n    float e_mc = decodeElev(texture2D(u_dem, v_uv));\n    float e_mr = decodeElev(texture2D(u_dem, v_uv + vec2( step.x,  0.0)));\n\n    float e_bl = decodeElev(texture2D(u_dem, v_uv + vec2(-step.x, -step.y)));\n    float e_bc = decodeElev(texture2D(u_dem, v_uv + vec2( 0.0,    -step.y)));\n    float e_br = decodeElev(texture2D(u_dem, v_uv + vec2( step.x, -step.y)));\n\n    // Sobel 3x3 Gradient Filters\n    float dzdx = ((e_tr + 2.0 * e_mr + e_br) - (e_tl + 2.0 * e_ml + e_bl)) / 8.0;\n    float dzdy = ((e_tl + 2.0 * e_tc + e_tr) - (e_bl + 2.0 * e_bc + e_br)) / 8.0;\n\n    // Surface normal with elevation scale\n    vec3 normal = normalize(vec3(-dzdx * u_zFactor, -dzdy * u_zFactor, 1.0));\n\n    // Dual-light Half-Lambert diffuse\n    float diff1 = dot(normal, u_light1Dir) * 0.5 + 0.5;\n    float diff2 = dot(normal, u_light2Dir) * 0.5 + 0.5;\n    float diffuse = diff1 * 0.76 + diff2 * 0.24;\n\n    // Discrete Laplacian for Ridge highlights & Valley AO\n    float laplacian = (e_tc + e_ml + e_mr + e_bc) - 4.0 * e_mc;\n    float curvature = clamp(-laplacian * u_curvatureStrength, -0.35, 0.35);\n\n    // Combined hillshade intensity\n    float shade = clamp(diffuse + curvature, 0.28, 1.38);\n\n    // Apply shadow opacity modulation\n    shade = mix(1.0, shade, u_shadowOpacity);\n\n    // Elevation hypsometric tinting via 1D LUT\n    // Mapping range: -500m to 9000m -> [0.0, 1.0]\n    float lutU = clamp((e_mc + 500.0) / 9500.0, 0.0, 1.0);\n    vec4 lutColor = texture2D(u_lut, vec2(lutU, 0.5));\n\n    vec3 baseColor = (u_useElevationColor > 0.5) ? lutColor.rgb : vec3(0.55, 0.60, 0.51);\n\n    // Water / Ocean smoothing: if elevation <= 0, soften shading\n    if (e_mc <= 0.0) {\n        shade = mix(1.0, shade, 0.35);\n    }\n\n    vec3 finalRgb = baseColor * shade;\n    gl_FragColor = vec4(finalRgb, 1.0);\n}";

        const vs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            throw new Error("Vertex shader compile error: " + gl.getShaderInfoLog(vs));
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            throw new Error("Fragment shader compile error: " + gl.getShaderInfoLog(fs));
        }

        const program = gl.createProgram()!;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Shader program link error: " + gl.getProgramInfoLog(program));
        }

        return program;
    }

    private createHypsometricLutTexture(): WebGLTexture {
        const gl = this.gl;
        const width = 1024;
        const data = new Uint8Array(width * 4);

        const stops = [
            { elev: -500,  color: [70, 110, 140] },
            { elev: -5,    color: [140, 185, 200] },
            { elev: 0,     color: [180, 200, 200] },
            { elev: 20,    color: [148, 176, 134] },
            { elev: 400,   color: [132, 160, 118] },
            { elev: 800,   color: [156, 170, 132] },
            { elev: 1200,  color: [174, 172, 140] },
            { elev: 1800,  color: [182, 176, 144] },
            { elev: 2500,  color: [174, 168, 146] },
            { elev: 3200,  color: [160, 162, 156] },
            { elev: 3800,  color: [172, 168, 148] },
            { elev: 4300,  color: [145, 150, 160] },
            { elev: 4700,  color: [115, 122, 138] },
            { elev: 5100,  color: [90, 98, 115] },
            { elev: 5350,  color: [255, 255, 255] },
            { elev: 9000,  color: [255, 255, 255] }
        ];

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        for (let i = 0; i < width; i++) {
            const t = i / (width - 1);
            const elev = -500 + t * 9500;
            let c1 = stops[0].color;
            let c2 = stops[stops.length - 1].color;
            let localT = 0;
            for (let s = 0; s < stops.length - 1; s++) {
                if (elev >= stops[s].elev && elev <= stops[s + 1].elev) {
                    c1 = stops[s].color;
                    c2 = stops[s + 1].color;
                    localT = (elev - stops[s].elev) / (stops[s + 1].elev - stops[s].elev);
                    break;
                }
            }
            const idx = i * 4;
            data[idx] = Math.round(lerp(c1[0], c2[0], localT));
            data[idx + 1] = Math.round(lerp(c1[1], c2[1], localT));
            data[idx + 2] = Math.round(lerp(c1[2], c2[2], localT));
            data[idx + 3] = 255;
        }

        const texture = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

        return texture;
    }

    public async renderTileToBitmap(
        demSource: TexImageSource,
        options: TerrainRenderOptions = {}
    ): Promise<ImageBitmap> {
        this.renderTileInternal(demSource, options);
        return await createImageBitmap(this.canvas);
    }

    public renderTileToCanvas(
        demSource: TexImageSource,
        options: TerrainRenderOptions = {}
    ): HTMLCanvasElement {
        this.renderTileInternal(demSource, options);
        return this.canvas;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    private renderTileInternal(
        demSource: TexImageSource,
        options: TerrainRenderOptions
    ): void {
        const gl = this.gl;
        gl.useProgram(this.program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.demTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, demSource);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.lutTexture);

        gl.uniform1i(this.uDemLoc, 0);
        gl.uniform1i(this.uLutLoc, 1);
        gl.uniform2f(this.uResolutionLoc, 256.0, 256.0);

        gl.uniform3f(this.uLight1DirLoc, -0.577, 0.577, 0.577);
        gl.uniform3f(this.uLight2DirLoc, -0.866, 0.0, 0.5);

        const rawZFactor = options.zFactor ?? 25.0;
        const normalizedZ = Math.max(0.01, (rawZFactor / 35.0) * 0.06);
        gl.uniform1f(this.uZFactorLoc, normalizedZ);

        const curvature = options.curvatureStrength ?? 0.0035;
        gl.uniform1f(this.uCurvatureLoc, curvature);

        gl.uniform1f(this.uShadowOpacityLoc, options.shadowOpacity ?? 1.0);
        gl.uniform1f(this.uUseElevationColorLoc, options.useElevationColor !== false ? 1.0 : 0.0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
