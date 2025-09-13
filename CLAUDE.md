# Claude Development Guidelines

## No Defensive Programming

When building this app, we explicitly avoid defensive programming. We want the application to fail fast and fail loudly when something is broken. This means:

- No try-catch blocks unless absolutely necessary
- No fallback values or default behaviors
- No silently handling errors
- Let errors propagate and crash the build/runtime

This approach helps us immediately identify and fix issues rather than masking them with defensive code.