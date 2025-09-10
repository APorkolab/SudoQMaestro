import * as Jimp from 'jimp';
import Tesseract from 'tesseract.js';

import { solveSudoku } from './sudoku.service.js';

/**
 * Processes an image of a Sudoku puzzle and returns the solved grid.
 *
 * NOTE: This implementation uses Jimp for image processing, not OpenCV,
 * due to environment constraints. It makes several simplifying assumptions:
 * 1. The Sudoku grid in the image is not significantly rotated or skewed.
 * 2. The grid occupies a majority of the image.
 * 3. The lighting is relatively even.
 * Advanced features like perspective correction are not implemented.
 *
 * @param {object} file - The image file object from multer, containing the buffer.
 * @returns {Promise<number[][] | null>} - The solved grid, or null if it cannot be solved.
 */
export const processAndSolveImage = async (file) => {
  try {
    const image = await Jimp.default.read(file.buffer);

    // 1. Pre-processing
    image.greyscale().contrast(0.5).autocrop();

    // We find the bounding box of the puzzle by finding the first non-white pixels
    // This is a crude way to find the grid without contour detection.
    const bounds = findGridBounds(image);
    image.crop(bounds.x, bounds.y, bounds.width, bounds.height);

    const puzzleGrid = Array(9).fill(0).map(() => Array(9).fill(0));
    const cellWidth = image.bitmap.width / 9;
    const cellHeight = image.bitmap.height / 9;

    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => console.log(m) // Log OCR progress
    });
    await worker.setParameters({
      tessedit_char_whitelist: '123456789',
    });

    // 3. OCR on each cell
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const cellImage = image.clone().crop(j * cellWidth, i * cellHeight, cellWidth, cellHeight);

        // Further process the cell for better OCR accuracy
        const processedCell = await processCellForOcr(cellImage);

        const buffer = await processedCell.getBufferAsync(Jimp.MIME_PNG);

        const { data: { text } } = await worker.recognize(buffer);
        const digit = parseInt(text.trim(), 10);

        if (!isNaN(digit) && digit >= 1 && digit <= 9) {
          puzzleGrid[i][j] = digit;
        } else {
          puzzleGrid[i][j] = 0; // Assume empty if not a valid digit
        }
      }
    }

    await worker.terminate();

    console.log('Recognized Grid:', puzzleGrid);

    // 4. Solve the puzzle
    return solveSudoku(puzzleGrid);

  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
};

/**
 * Heuristic-based function to find the bounds of the Sudoku grid.
 * It trims the image based on a color threshold.
 */
const findGridBounds = (image) => {
    let minX = image.bitmap.width, minY = image.bitmap.height, maxX = 0, maxY = 0;
    const threshold = 128; // Simple threshold for non-white

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        if (red < threshold) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}


/**
 * Processes a single cell image to improve OCR accuracy.
 * - Inverts colors
 * - Adds padding
 * - Increases contrast
 */
const processCellForOcr = async (cellImage) => {
    // Invert and increase contrast to make the digit stand out
    cellImage.invert().contrast(0.5);

    // Create a new white image with padding
    const paddedWidth = cellImage.bitmap.width * 2;
    const paddedHeight = cellImage.bitmap.height * 2;
    const paddedImage = new Jimp.default(paddedWidth, paddedHeight, 'white');

    // Composite the digit in the center of the padded image
    const x = Math.floor((paddedWidth - cellImage.bitmap.width) / 2);
    const y = Math.floor((paddedHeight - cellImage.bitmap.height) / 2);
    paddedImage.composite(cellImage, x, y);

    return paddedImage;
}
