import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SudokuApiService, SudokuGenerationResult } from './sudoku-api';

describe('SudokuApiService', () => {
  let service: SudokuApiService;
  let httpTestingController: HttpTestingController;
  const apiUrl = 'http://localhost:5000/api/sudoku';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SudokuApiService]
    });
    service = TestBed.inject(SudokuApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateSudoku', () => {
    it('should return a generated puzzle and solution', () => {
      const mockResult: SudokuGenerationResult = {
        puzzle: [[0]],
        solution: [[1]]
      };

      service.generateSudoku('easy').subscribe(data => {
        expect(data).toEqual(mockResult);
      });

      // The following `expectOne()` will match the request's URL.
      const req = httpTestingController.expectOne(`${apiUrl}/generate?difficulty=easy`);

      // Assert that the request is a GET.
      expect(req.request.method).toEqual('GET');

      // Respond with the mock data
      req.flush(mockResult);
    });
  });

  describe('solveFromImage', () => {
    it('should upload an image and return a solution', () => {
      const mockSolution = { solution: [[9]] };
      const mockFile = new File(['dummy'], 'dummy.png', { type: 'image/png' });

      service.solveFromImage(mockFile).subscribe(data => {
        expect(data).toEqual(mockSolution);
      });

      const req = httpTestingController.expectOne(`${apiUrl}/solve-from-image`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body instanceof FormData).toBe(true);

      req.flush(mockSolution);
    });
  });
});
