# Contributing to SudoQMaestro

We love your input! We want to make contributing to SudoQMaestro as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js (v20 or higher)
- MongoDB (v6.0 or higher)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SudoQMaestro.git
   cd SudoQMaestro
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your local configuration
   npm run dev
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   ng serve
   ```

4. **Run tests**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests
   cd frontend && ng test
   ```

## Code Style

### Backend (Node.js/Express)

- Use ES6+ features and modules
- Follow the existing ESLint configuration
- Use meaningful variable and function names
- Write JSDoc comments for functions
- Use async/await over promises
- Handle errors appropriately

```javascript
/**
 * Processes uploaded Sudoku image
 * @param {Object} file - Uploaded file object
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Processed sudoku data
 */
async function processSudokuImage(file, userId) {
  try {
    // Implementation
  } catch (error) {
    logger.error('Error processing sudoku image:', error);
    throw error;
  }
}
```

### Frontend (Angular/TypeScript)

- Follow Angular style guide
- Use TypeScript strictly
- Implement proper component lifecycle
- Use reactive forms
- Follow the existing linting rules

```typescript
export interface SudokuPuzzle {
  id: string;
  grid: number[][];
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

@Component({
  selector: 'app-sudoku-grid',
  templateUrl: './sudoku-grid.component.html',
  styleUrls: ['./sudoku-grid.component.scss']
})
export class SudokuGridComponent implements OnInit {
  // Implementation
}
```

## Testing Guidelines

### Backend Testing

- Write unit tests for all utility functions
- Write integration tests for API endpoints
- Use Jest and supertest
- Aim for >70% code coverage
- Mock external dependencies

```javascript
describe('Sudoku API', () => {
  test('POST /api/sudoku/upload should process image', async () => {
    const response = await request(app)
      .post('/api/sudoku/upload')
      .attach('image', path.join(__dirname, 'fixtures/sudoku.png'))
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('grid');
  });
});
```

### Frontend Testing

- Write unit tests for components and services
- Use Jasmine and Karma
- Test user interactions
- Mock HTTP calls

```typescript
describe('SudokuGridComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SudokuGridComponent],
      imports: [ReactiveFormsModule]
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SudokuGridComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
```

## Commit Message Format

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(backend): add image upload validation
fix(frontend): resolve sudoku grid display issue
docs: update API documentation
test(backend): add unit tests for auth middleware
```

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening)

### Feature Requests

Use the feature request template and include:

- Summary of the feature
- Motivation: why is this feature needed?
- Detailed description
- Alternatives considered

## Security Issues

Please do not report security issues in public. Instead, send an email to [security@yourdomain.com].

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to contact the maintainers if you have any questions. We're here to help!
