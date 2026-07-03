// Runs in the page's main world alongside injected.js. Canvas drawing
// routines for each distortion mode, exposed as window.__callAnonymizerEffects
// so injected.js can call in without a bundler. All source rects are in the
// video's natural pixel size, which injected.js keeps 1:1 with the canvas.

(function () {
  const pixelateScratch = document.createElement('canvas');
  const pixelateScratchCtx = pixelateScratch.getContext('2d');

  function drawBlur(ctx, video, canvas, intensity) {
    ctx.filter = `blur(${intensity}px)`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
  }

  function drawPixelate(ctx, video, canvas, intensity) {
    const block = Math.max(2, Math.round(2 + (intensity / 40) * 38));
    const smallW = Math.max(1, Math.floor(canvas.width / block));
    const smallH = Math.max(1, Math.floor(canvas.height / block));
    pixelateScratch.width = smallW;
    pixelateScratch.height = smallH;
    pixelateScratchCtx.drawImage(video, 0, 0, smallW, smallH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixelateScratch, 0, 0, smallW, smallH, 0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
  }

  function ensurePuzzlePermutation(effectState, gridSize) {
    if (effectState.puzzleGridSize === gridSize && effectState.puzzlePermutation) return;
    const total = gridSize * gridSize;
    const perm = Array.from({ length: total }, (_, i) => i);
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    effectState.puzzlePermutation = perm;
    effectState.puzzleGridSize = gridSize;
  }

  function drawPuzzle(ctx, video, canvas, gridSize, effectState) {
    ensurePuzzlePermutation(effectState, gridSize);
    const tileW = canvas.width / gridSize;
    const tileH = canvas.height / gridSize;
    const perm = effectState.puzzlePermutation;
    for (let destIndex = 0; destIndex < perm.length; destIndex++) {
      const srcIndex = perm[destIndex];
      const srcX = (srcIndex % gridSize) * tileW;
      const srcY = Math.floor(srcIndex / gridSize) * tileH;
      const dstX = (destIndex % gridSize) * tileW;
      const dstY = Math.floor(destIndex / gridSize) * tileH;
      ctx.drawImage(video, srcX, srcY, tileW, tileH, dstX, dstY, tileW, tileH);
    }
  }

  function drawGlitch(ctx, video, canvas, intensity) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const maxOffset = Math.max(1, Math.round(intensity));
    const bandCount = 8;
    const bandHeight = canvas.height / bandCount;
    for (let b = 0; b < bandCount; b++) {
      if (Math.random() > 0.5) continue;
      const y = b * bandHeight;
      const offsetX = (Math.random() * 2 - 1) * maxOffset;
      ctx.drawImage(video, 0, y, canvas.width, bandHeight, offsetX, y, canvas.width, bandHeight);
    }

    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'hue-rotate(180deg) saturate(3)';
    ctx.drawImage(video, maxOffset * 0.3, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
  }

  window.__callAnonymizerEffects = {
    draw(ctx, video, canvas, settings, effectState) {
      switch (settings.mode) {
        case 'pixelate':
          return drawPixelate(ctx, video, canvas, settings.intensity);
        case 'puzzle':
          return drawPuzzle(ctx, video, canvas, settings.puzzleGrid, effectState);
        case 'glitch':
          return drawGlitch(ctx, video, canvas, settings.intensity);
        case 'blur':
        default:
          return drawBlur(ctx, video, canvas, settings.intensity);
      }
    },
    resetPuzzle(effectState) {
      effectState.puzzlePermutation = null;
    },
  };
})();
