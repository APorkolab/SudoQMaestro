# API Rate Limiting

This document describes the rate limiting rules implemented in the SudoQMaestro API to protect against abuse and ensure fair resource usage.

## Overview

Rate limiting is applied at different levels throughout the application:
1. **Global rate limiting** - Applied to all requests
2. **Route-specific rate limiting** - Applied to specific endpoints based on their resource requirements
3. **Operation-specific rate limiting** - Applied based on the type of operation (auth, uploads, admin, etc.)

## Rate Limiters

### Global Rate Limiter
- **Scope**: All API requests
- **Window**: 15 minutes  
- **Limit**: 100 requests per IP
- **Applied to**: All incoming requests (configured in `server.js`)

### Authentication Limiter (`authLimiter`)
- **Scope**: Authentication endpoints
- **Window**: 15 minutes
- **Limit**: 5 requests per IP
- **Applied to**: `/api/auth/google`, `/api/auth/google/callback`
- **Purpose**: Prevent brute force authentication attempts

### Upload Limiter (`uploadLimiter`)
- **Scope**: File upload endpoints
- **Window**: 15 minutes
- **Limit**: 10 requests per IP
- **Applied to**: `/api/sudoku/solve-from-image`
- **Purpose**: Control resource-intensive image processing requests

### Solve Limiter (`solveLimiter`)
- **Scope**: Puzzle solving endpoints
- **Window**: 5 minutes
- **Limit**: 20 requests per IP
- **Applied to**: `/api/sudoku/solve`
- **Purpose**: Limit computationally expensive solving operations

### Generate Limiter (`generateLimiter`)
- **Scope**: Puzzle generation endpoints
- **Window**: 5 minutes
- **Limit**: 50 requests per IP
- **Applied to**: `/api/sudoku/generate`
- **Purpose**: Control puzzle generation requests

### Admin Limiter (`adminLimiter`)
- **Scope**: Admin read operations
- **Window**: 10 minutes
- **Limit**: 30 requests per IP
- **Applied to**: `/api/admin/users` (GET), `/api/admin/puzzles` (GET)
- **Purpose**: Control access to admin data retrieval

### Modification Limiter (`modificationLimiter`)
- **Scope**: Data modification operations
- **Window**: 10 minutes
- **Limit**: 100 requests per IP
- **Applied to**: 
  - `/api/sudoku/save` (POST)
  - `/api/admin/users/:id` (DELETE, PUT)
  - `/api/admin/puzzles/:id` (DELETE)
  - `/api/puzzles` (POST)
- **Purpose**: Control data modification requests

### Health Limiter (`healthLimiter`)
- **Scope**: Health check endpoints
- **Window**: 1 minute
- **Limit**: 10 requests per IP
- **Applied to**: `/health`, `/ready`, `/live`
- **Purpose**: Allow frequent health checks while preventing abuse

### General Limiter (`generalLimiter`)
- **Scope**: Standard API operations
- **Window**: 15 minutes
- **Limit**: 200 requests per IP
- **Applied to**: 
  - `/api/auth/logout`
  - `/api/auth/current-user`
  - `/api/puzzles` (GET)
- **Purpose**: Standard rate limiting for general API usage

## Rate Limiting Headers

All rate-limited responses include standard headers:
- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Error Responses

When rate limits are exceeded, clients receive:
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

Status Code: `429 Too Many Requests`

## Configuration

Rate limiters are configured in `/backend/config/security.js` and can be adjusted based on:
- Server capacity
- Expected traffic patterns
- Security requirements
- Resource constraints

## Bypass Options

Rate limiting can be bypassed for:
- Health checks (global limiter skips `/health` path)
- Internal service requests (configure `skip` function)
- Whitelisted IPs (not currently implemented)

## Monitoring

Rate limiting metrics should be monitored for:
- Frequent limit violations (potential attacks)
- Legitimate users hitting limits (may need adjustment)
- Performance impact of rate limiting middleware

## Best Practices

1. **Monitor and adjust**: Regularly review rate limits based on actual usage
2. **User feedback**: Provide clear error messages with retry information
3. **Gradual enforcement**: Consider warning periods for new limits
4. **Different limits for authenticated users**: Consider higher limits for authenticated requests
5. **Sliding windows**: Current implementation uses fixed windows, consider sliding windows for smoother behavior

## Security Considerations

- Rate limiting is IP-based, consider user-based limiting for authenticated endpoints
- Combine with other security measures (authentication, input validation)
- Monitor for distributed attacks that might bypass IP-based limiting
- Consider implementing progressive delays for repeated violations
