---
tags:
  - service
  - auth
  - user
title: UserService
type: component
---
# UserService

Handles user creation, authentication, and profile management.

## Methods
- createUser(email, password) — creates a password-based user
- findByEmail(email) — looks up user by email

## Related
- [[auth-service]] — delegates login to UserService
