import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SudokuApiService, SudokuGrid } from '../../services/sudoku-api';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-uploader.html',
  styleUrl: './image-uploader.scss'
})
export class ImageUploaderComponent {
  @Output() solveSuccess = new EventEmitter<SudokuGrid>();
  @Output() uploadError = new EventEmitter<string>();

  private sudokuService = inject(SudokuApiService);

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isLoading = false;
  error: string | null = null;

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.error = null;

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onUpload(): void {
    if (!this.selectedFile) {
      this.error = 'Please select a file first.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.sudokuService.solveFromImage(this.selectedFile).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.solveSuccess.emit(result.solution);
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err.error?.msg || err.message || 'Failed to solve puzzle from image.';
        this.error = errorMessage;
        this.uploadError.emit(errorMessage);
        console.error('Image solve error:', err);
      }
    });
  }
}
