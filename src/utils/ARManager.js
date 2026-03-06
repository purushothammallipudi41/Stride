
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

class ARManager {
    constructor() {
        this.faceLandmarker = null;
        this.isInitializing = false;
        this.results = null;
    }

    async init() {
        if (this.faceLandmarker || this.isInitializing) return;
        this.isInitializing = true;

        try {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1
            });
            console.log('[AR] FaceLandmarker initialized');
        } catch (error) {
            console.error('[AR] Initialization failed:', error);
        } finally {
            this.isInitializing = false;
        }
    }

    processFrame(videoElement, timestamp) {
        if (!this.faceLandmarker) return null;
        this.results = this.faceLandmarker.detectForVideo(videoElement, timestamp);
        return this.results;
    }

    drawEffect(ctx, results, filter, width, height) {
        if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) return;

        const landmarks = results.faceLandmarks[0];

        if (filter.type === 'mesh') {
            ctx.save();
            ctx.strokeStyle = filter.color || '#00f2ff';
            ctx.lineWidth = filter.lineWidth || 1;
            ctx.beginPath();

            // Draw a simplified mesh for performance (outline and eyes)
            // Typical indices for Face Mesh (simplified)
            const irisIndices = [468, 469, 470, 471, 472, 473, 474, 475, 476, 477];

            landmarks.forEach((point, i) => {
                if (i % 10 === 0) { // Sparse mesh
                    ctx.moveTo(point.x * width, point.y * height);
                    ctx.arc(point.x * width, point.y * height, 1, 0, Math.PI * 2);
                }
            });
            ctx.stroke();
            ctx.restore();
        }
    }

    applyLut(ctx, filter, width, height) {
        if (filter.type === 'beauty' || filter.type === 'lut') {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.filter = filter.filter || 'none';
            // Beauty filters are often better handled via CSS filters on the canvas itself
            ctx.restore();
        }
    }
}

export const arManager = new ARManager();
