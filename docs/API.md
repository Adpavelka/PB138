# API contract

This file contains a list of API calls utilized in the system along with their definition.

---

## Authorization

### POST /api/auth/register

Register a new user account. On success, sends a confirmation email and
returns the created user. The new user is assigned the REGISTERED_USER
role automatically.

**Auth required:** No

**Request body:**
```json
{
    "newspaper_id": "4dfsa..",
    "email": "jan.novak@example.com",
    "username": "jannovak",
    "full_name": "Jan Novák",
    "password": "securePassword123"
}
```
Field rules:
```
┌───────────────┬──────────┬──────────────────────────────────────────────────────────┐
│   Field       │ Required │                  Notes                                   │
├───────────────┼──────────┼──────────────────────────────────────────────────────────┤
│ newspaper_id  │ yes      │ newspaper uuid, valid uuid of a newspaper                │
├───────────────┼──────────┼──────────────────────────────────────────────────────────┤
│ email         │ yes      │ (email, newspaper_id) must be unique, valid email format │
├───────────────┼──────────┼──────────────────────────────────────────────────────────┤
│ username      │ yes      │ (username, newspaper_id) must be unique                  │
├───────────────┼──────────┼──────────────────────────────────────────────────────────┤
│ full_name     │ no       │ display name                                             │
├───────────────┼──────────┼──────────────────────────────────────────────────────────┤
│ password      │ yes      │ min 8 characters, stored as bcrypt hash                  │
└───────────────┴──────────┴──────────────────────────────────────────────────────────┘
```

**Responses:**

`201 Created`
```json
{
    "id": "b3d2a1f0-...",
    "email": "jan.novak@example.com",
    "username": "jannovak",
    "full_name": "Jan Novák",
    "email_verified": false
}
```

`409 Conflict` — email or username already taken
```json
{ "error": "EMAIL_TAKEN" }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "password": "Must be at least 8 characters" }
}
```

Side effects:
- Sends a confirmation email to the provided address
- Creates an audit log entry (operation: USER_REGISTER)

---

### POST /api/auth/verify-email

The email contains a link like `https://your-site.com/verify-email?token=<token>`. The frontend extracts the token and calls this endpoint to activate the account.

**Auth required:** No

**Request body:**
```json
{ "token": "a7f3c2..." }
```

**Responses:**

`200 OK` — account activated, user can now log in
```json
{ "message": "Email verified successfully" }
```

`400 Bad Request` — token is invalid or has expired
```json
{ "error": "INVALID_TOKEN" }
```

---

### POST /api/auth/login

Authenticate a user within a specific newspaper. Returns a JWT token to be
included in the `Authorization` header of subsequent requests.

**Auth required:** No

**Request body:**
```json
{
    "newspaper_id": "d4e5f6...",
    "email": "jan.novak@example.com",
    "password": "securePassword123"
}
```

Field rules:
```
┌──────────────┬──────────┬────────────────────────────────────────┐
│    Field     │ Required │                 Notes                  │
├──────────────┼──────────┼────────────────────────────────────────┤
│ newspaper_id │ yes      │ identifies which newspaper to log into │
├──────────────┼──────────┼────────────────────────────────────────┤
│ email        │ yes      │                                        │
├──────────────┼──────────┼────────────────────────────────────────┤
│ password     │ yes      │                                        │
└──────────────┴──────────┴────────────────────────────────────────┘
```

**Responses:**

`200 OK`
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "b3d2a1f0-...",
        "email": "jan.novak@example.com",
        "username": "jannovak",
        "full_name": "Jan Novák",
        "roles": ["REGISTERED_USER"]
    }
}
```

`401 Unauthorized` — wrong email or password
```json
{ "error": "INVALID_CREDENTIALS" }
```

`403 Forbidden` — email not yet verified
```json
{ "error": "EMAIL_NOT_VERIFIED" }
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

Side effects:
- Creates an audit log entry (operation: USER_LOGIN)

---

### POST /api/auth/logout

Invalidate the current JWT token and log the user out.

**Auth required:** Yes — any authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`200 OK`
```json
{ "message": "Logged out successfully" }
```

`401 Unauthorized` — no token provided or token already invalid
```json
{ "error": "UNAUTHORIZED" }
```

Side effects:
- Adds the token to a server-side blocklist (token is immediately invalid)
- Creates an audit log entry (operation: USER_LOGOUT)

---

### POST /api/auth/forgot-password

Send a password reset link to the user's email address.

**Auth required:** No

**Request body:**
```json
{
    "newspaper_id": "d4e5f6...",
    "email": "jan.novak@example.com"
}
```

Field rules:
```
┌──────────────┬──────────┬──────────────────────────────────────────┐
│    Field     │ Required │                 Notes                    │
├──────────────┼──────────┼──────────────────────────────────────────┤
│ newspaper_id │ yes      │ identifies the newspaper context         │
├──────────────┼──────────┼──────────────────────────────────────────┤
│ email        │ yes      │ must match a registered account          │
└──────────────┴──────────┴──────────────────────────────────────────┘
```

**Responses:**

`200 OK` — reset email sent (response is identical whether or not the email exists, to prevent user enumeration)
```json
{ "message": "If that address is registered, a reset link has been sent." }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "email": "Must be a valid email address" }
}
```

Side effects:
- If the email matches a registered user, sends a password reset email containing a time-limited token
- Creates an audit log entry (operation: PASSWORD_RESET_REQUESTED)

---

### POST /api/auth/reset-password

Set a new password using the token received in the reset email.

**Auth required:** No

**Request body:**
```json
{
    "token": "a7f3c2...",
    "password": "newSecurePassword456"
}
```

Field rules:
```
┌──────────┬──────────┬────────────────────────────────────────┐
│  Field   │ Required │                 Notes                  │
├──────────┼──────────┼────────────────────────────────────────┤
│ token    │ yes      │ time-limited token from the reset email│
├──────────┼──────────┼────────────────────────────────────────┤
│ password │ yes      │ min 8 characters                       │
└──────────┴──────────┴────────────────────────────────────────┘
```

**Responses:**

`200 OK`
```json
{ "message": "Password reset successfully" }
```

`400 Bad Request` — token is invalid or has expired
```json
{ "error": "INVALID_TOKEN" }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "password": "Must be at least 8 characters" }
}
```

Side effects:
- Invalidates all existing JWT tokens for the user
- Creates an audit log entry (operation: PASSWORD_RESET)

---

### POST /api/auth/resend-verification

Resend the email verification link to the user's email address.

**Auth required:** No

**Request body:**
```json
{
    "newspaper_id": "d4e5f6...",
    "email": "jan.novak@example.com"
}
```

**Responses:**

`200 OK` — verification email sent (response is identical whether or not the email exists)
```json
{ "message": "If that address is registered and unverified, a new verification link has been sent." }
```

`429 Too Many Requests` — resend attempted too recently
```json
{ "error": "RESEND_TOO_SOON" }
```

Side effects:
- Invalidates any previously issued verification tokens for this user
- Sends a new confirmation email
- Creates an audit log entry (operation: VERIFICATION_RESENT)

---

## User Profile

### GET /api/users/me

Return the profile of the currently authenticated user.

**Auth required:** Yes — any authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`200 OK`
```json
{
    "id": "b3d2a1f0-...",
    "email": "jan.novak@example.com",
    "username": "jannovak",
    "full_name": "Jan Novák",
    "email_verified": true,
    "profile_picture": "https://...",
    "bio": "Senior reporter covering technology.",
    "roles": ["REGISTERED_USER", "AUTHOR"]
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

---

### PUT /api/users/me

Update the profile of the currently authenticated user. All fields are optional; only supplied fields are updated.

**Auth required:** Yes — any authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
    "username": "novyusername",
    "full_name": "Jan Novák Jr.",
    "bio": "Updated bio text.",
    "password": "newPassword123"
}
```

Field rules:
```
┌──────────┬──────────┬──────────────────────────────────────────────────┐
│  Field   │ Required │                     Notes                        │
├──────────┼──────────┼──────────────────────────────────────────────────┤
│ username │ no       │ (username, newspaper_id) must remain unique       │
├──────────┼──────────┼──────────────────────────────────────────────────┤
│ full_name│ no       │ display name                                      │
├──────────┼──────────┼──────────────────────────────────────────────────┤
│ bio      │ no       │ free text biography                               │
├──────────┼──────────┼──────────────────────────────────────────────────┤
│ password │ no       │ min 8 characters, stored as bcrypt hash           │
└──────────┴──────────┴──────────────────────────────────────────────────┘
```

**Responses:**

`200 OK`
```json
{
    "id": "b3d2a1f0-...",
    "email": "jan.novak@example.com",
    "username": "novyusername",
    "full_name": "Jan Novák Jr.",
    "bio": "Updated bio text."
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`409 Conflict` — username already taken
```json
{ "error": "USERNAME_TAKEN" }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "password": "Must be at least 8 characters" }
}
```

Side effects:
- If password is changed, all existing JWT tokens for the user are invalidated
- Creates an audit log entry (operation: USER_PROFILE_UPDATED)

---

### POST /api/users/me/profile-picture

Upload or replace the profile picture of the currently authenticated user.
Required for users newly assigned a content administrator role (AUTHOR, EDITOR, NEWSPAPER_MANAGER) before they can access any other endpoints after their first login following the role assignment.

**Auth required:** Yes — any authenticated user

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request body:**
```
profile_picture   image file (JPEG or PNG, max 5 MB)
```

**Responses:**

`200 OK`
```json
{
    "profile_picture": "https://..."
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`422 Unprocessable Entity` — file missing, wrong type, or too large
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "profile_picture": "Must be a JPEG or PNG image under 5 MB" }
}
```

Side effects:
- Replaces any previously stored profile picture
- Creates an audit log entry (operation: PROFILE_PICTURE_UPDATED)

---

## Authors

### GET /api/newspapers/:newspaper_id/authors/:author_id

Return the public profile of an author including biography, profile picture,
and a paginated list of their published articles within this newspaper.

**Auth required:** No

**URL parameters:**

| Parameter     | Description           |
|---------------|-----------------------|
| newspaper_id  | UUID of the newspaper |
| author_id     | UUID of the author    |

**Query parameters:**

| Parameter | Type    | Required | Default | Description              |
|-----------|---------|----------|---------|--------------------------|
| page      | integer | no       | 1       | Page number              |
| limit     | integer | no       | 20      | Articles per page (max 50) |

**Responses:**

`200 OK`
```json
{
    "id": "u1u2u3...",
    "full_name": "Jan Novák",
    "username": "jannovak",
    "bio": "Senior reporter covering technology.",
    "profile_picture": "https://...",
    "articles": {
        "data": [
            {
                "id": "a1b2c3...",
                "title": "Breaking Article",
                "perex": "Short introduction",
                "publication_date": "2026-04-10T08:00:00Z",
                "category": "Technology",
                "keywords": ["bun", "typescript"],
                "primary_image": {
                    "url": "https://...",
                    "caption": "Image caption"
                }
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 12,
            "total_pages": 1
        }
    }
}
```

`404 Not Found` — newspaper or author does not exist
```json
{ "error": "AUTHOR_NOT_FOUND" }
```

---

## Newspaper Articles

### GET /api/newspapers/:newspaper_id/articles

Returns a paginated list of published articles for a newspaper, sorted by
publication date descending. Used to populate the homepage.

**Auth required:** No

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Query parameters:**

| Parameter | Type    | Required | Default | Description                 |
|-----------|---------|---------|---------|-----------------------------|
| page      | integer | no      | 1       | Page number                 |
| limit     | integer | no      | 20      | Articles per page (max 50)  |
| category  | string  | no      | —       | Filter by category name     |

**Responses:**

`200 OK`
```json
{
    "data": [
        {
            "id": "a1b2c3...",
            "title": "Breaking Article",
            "perex": "Short introduction",
            "publication_date": "2026-04-10T08:00:00Z",
            "category": "Sport",
            "keywords": ["football", "UEFA"],
            "primary_image": {
                "url": "https://...",
                "caption": "Image caption"
            },
            "author": {
                "id": "u1u2u3...",
                "full_name": "Andy Anderson",
                "profile_picture": "https://..."
            }
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 84,
        "total_pages": 5
    }
}
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

### GET /api/newspapers/:newspaper_id/articles/:article_id

Returns the full content of a single published article.

**Auth required:** Yes — `REGISTERED_USER` or above within this newspaper

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`200 OK`
```json
{
    "id": "a1b2c3...",
    "title": "První článek",
    "perex": "Krátký úvod do článku...",
    "content": "Plný text článku...",
    "publication_date": "2026-04-10T08:00:00Z",
    "category": "Technology",
    "category_slug": "technology",
    "keywords": ["bun", "typescript"],
    "likes_count": 42,
    "liked_by_me": true,
    "author": {
        "id": "u1u2u3...",
        "full_name": "Jan Novák",
        "profile_picture": "https://..."
    },
    "images": [
        {
            "url": "https://...",
            "caption": "Image caption",
            "is_primary": true
        }
    ],
    "comments": [
        {
            "id": "c1c2c3...",
            "content": "Skvělý článek!",
            "created_at": "2026-04-10T09:00:00Z",
            "author": {
                "id": "u4u5u6...",
                "username": "petrnovak"
            }
        }
    ]
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — token is valid but user belongs to a different newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist or is not published
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

---

### POST /api/newspapers/:newspaper_id/articles

Create a new article draft. The article is created in `DRAFT` state and is
not visible to readers.

**Auth required:** Yes — `AUTHOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
    "title": "My New Article",
    "perex": "A short introduction to the article.",
    "content": "The full article text...",
    "category_id": "cat123...",
    "keywords": ["technology", "bun"]
}
```

Field rules:
```
┌─────────────┬──────────┬──────────────────────────────────────────────┐
│    Field    │ Required │                   Notes                      │
├─────────────┼──────────┼──────────────────────────────────────────────┤
│ title       │ yes      │ non-empty string                             │
├─────────────┼──────────┼──────────────────────────────────────────────┤
│ perex       │ yes      │ short preview text shown on listings         │
├─────────────┼──────────┼──────────────────────────────────────────────┤
│ content     │ yes      │ full article body                            │
├─────────────┼──────────┼──────────────────────────────────────────────┤
│ category_id │ yes      │ must reference an existing category          │
├─────────────┼──────────┼──────────────────────────────────────────────┤
│ keywords    │ no       │ array of strings                             │
└─────────────┴──────────┴──────────────────────────────────────────────┘
```

**Responses:**

`201 Created`
```json
{
    "id": "a1b2c3...",
    "title": "My New Article",
    "perex": "A short introduction to the article.",
    "content": "The full article text...",
    "category": "Technology",
    "keywords": ["technology", "bun"],
    "status": "DRAFT",
    "created_at": "2026-04-12T10:00:00Z"
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have the AUTHOR role in this newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — newspaper or category does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "title": "Title is required" }
}
```

Side effects:
- Creates an audit log entry (operation: ARTICLE_CREATED)

---

### PUT /api/newspapers/:newspaper_id/articles/:article_id

Edit an existing article draft. Only the owning author may edit their own article,
and only while it is in `DRAFT` state.

**Auth required:** Yes — `AUTHOR` (own articles only)

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
    "title": "Updated Title",
    "perex": "Updated perex.",
    "content": "Updated full text...",
    "category_id": "cat456...",
    "keywords": ["updated", "keywords"]
}
```

All fields are optional; only supplied fields are updated.

**Responses:**

`200 OK`
```json
{
    "id": "a1b2c3...",
    "title": "Updated Title",
    "perex": "Updated perex.",
    "content": "Updated full text...",
    "category": "Sport",
    "keywords": ["updated", "keywords"],
    "status": "DRAFT",
    "updated_at": "2026-04-12T11:00:00Z"
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — article belongs to another author or is not in DRAFT state
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "title": "Title cannot be empty" }
}
```

Side effects:
- Creates an audit log entry (operation: ARTICLE_UPDATED)

---

### DELETE /api/newspapers/:newspaper_id/articles/:article_id

Permanently delete an article. Authors may only delete their own articles.
System administrators may delete any article.

**Auth required:** Yes — `AUTHOR` (own articles) or `SYSTEM_ADMINISTRATOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`204 No Content` — article deleted successfully

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — insufficient permissions
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

Side effects:
- Removes all associated images, comments, and likes
- Creates an audit log entry (operation: ARTICLE_DELETED)

---

### POST /api/newspapers/:newspaper_id/articles/:article_id/submit

Submit a draft article for editorial review. Transitions the article from `DRAFT`
to `SUBMITTED`. The article must have at least one image before it can be submitted.

**Auth required:** Yes — `AUTHOR` (own articles only)

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`200 OK`
```json
{
    "id": "a1b2c3...",
    "status": "SUBMITTED"
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — article belongs to another author or is not in DRAFT state
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — article cannot be submitted (e.g., missing required image)
```json
{ "error": "ARTICLE_MISSING_IMAGE" }
```

Side effects:
- Creates an audit log entry (operation: ARTICLE_SUBMITTED)

---

### POST /api/newspapers/:newspaper_id/articles/:article_id/images

Upload an image for an article. The first uploaded image automatically becomes
the primary image.

**Auth required:** Yes — `AUTHOR` (own articles only)

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request body:**
```
image     image file (JPEG or PNG, max 10 MB)
caption   string (optional) — descriptive caption for the image
```

**Responses:**

`201 Created`
```json
{
    "id": "img123...",
    "url": "https://...",
    "caption": "Image caption",
    "is_primary": true
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — article belongs to another author
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — file missing, wrong type, or too large
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "image": "Must be a JPEG or PNG image under 10 MB" }
}
```

Side effects:
- Creates an audit log entry (operation: ARTICLE_IMAGE_UPLOADED)

---

### DELETE /api/newspapers/:newspaper_id/articles/:article_id/images/:image_id

Remove an image from an article. Cannot remove the primary image if it is the
only image on the article.

**Auth required:** Yes — `AUTHOR` (own articles only)

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |
| image_id     | UUID of the image     |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`204 No Content` — image deleted successfully

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — article belongs to another author
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — image does not exist
```json
{ "error": "IMAGE_NOT_FOUND" }
```

`422 Unprocessable Entity` — cannot remove the only image from an article
```json
{ "error": "ARTICLE_MUST_HAVE_ONE_IMAGE" }
```

Side effects:
- If the deleted image was primary, the next image in upload order becomes primary
- Creates an audit log entry (operation: ARTICLE_IMAGE_DELETED)

---

### POST /api/newspapers/:newspaper_id/articles/:article_id/assign-editor

Assign an editor to a submitted article. Transitions the article from `SUBMITTED`
to `IN_REVIEW`.

**Auth required:** Yes — `NEWSPAPER_MANAGER`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{ "editor_id": "u7u8u9..." }
```

Field rules:
```
┌───────────┬──────────┬────────────────────────────────────────────┐
│   Field   │ Required │                  Notes                     │
├───────────┼──────────┼────────────────────────────────────────────┤
│ editor_id │ yes      │ UUID of a user with the EDITOR role in     │
│           │          │ this newspaper                             │
└───────────┴──────────┴────────────────────────────────────────────┘
```

**Responses:**

`200 OK`
```json
{
    "id": "a1b2c3...",
    "status": "IN_REVIEW",
    "assigned_editor": {
        "id": "u7u8u9...",
        "full_name": "Eva Editorová"
    }
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have NEWSPAPER_MANAGER role in this newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article or editor does not exist
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — article is not in SUBMITTED state, or target user is not an editor
```json
{ "error": "INVALID_ARTICLE_STATE" }
```

Side effects:
- Creates an audit log entry (operation: ARTICLE_EDITOR_ASSIGNED)

---

### POST /api/newspapers/:newspaper_id/articles/:article_id/review

Submit a review decision for an article that is `IN_REVIEW`. The assigned
editor may approve the article, reject it, or return it to the author for revision.

**Auth required:** Yes — `EDITOR` (assigned to this article)

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
    "decision": "APPROVE",
    "note": "Well written, approved for manager review."
}
```

Field rules:
```
┌──────────┬──────────┬───────────────────────────────────────────────────────┐
│  Field   │ Required │                       Notes                           │
├──────────┼──────────┼───────────────────────────────────────────────────────┤
│ decision │ yes      │ one of: APPROVE, REJECT, REQUEST_REVISION             │
├──────────┼──────────┼───────────────────────────────────────────────────────┤
│ note     │ no       │ feedback for the author; required when decision is     │
│          │          │ REJECT or REQUEST_REVISION                             │
└──────────┴──────────┴───────────────────────────────────────────────────────┘
```

State transitions:
- `APPROVE` → article moves to `APPROVED_BY_EDITOR`
- `REJECT` → article moves to `REJECTED`
- `REQUEST_REVISION` → article moves back to `DRAFT`

**Responses:**

`200 OK`
```json
{
    "id": "a1b2c3...",
    "status": "APPROVED_BY_EDITOR",
    "note": "Well written, approved for manager review."
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user is not the assigned editor for this article
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — article is not in IN_REVIEW state, or note missing for rejection
```json
{ "error": "INVALID_ARTICLE_STATE" }
```

Side effects:
- Notifies the article's author of the decision by email
- Creates an audit log entry (operation: ARTICLE_REVIEWED)

---

### POST /api/newspapers/:newspaper_id/articles/:article_id/approve

Approve an article, advancing it to the next stage in the workflow.
The effect of this call depends on the caller's role:
- `NEWSPAPER_MANAGER`: advances from `APPROVED_BY_EDITOR` → `APPROVED_BY_MANAGER`
- `DIRECTOR`: advances from `APPROVED_BY_MANAGER` → `APPROVED_BY_DIRECTOR`

Managers and Directors may also reject the article or return it to draft at this stage.

**Auth required:** Yes — `NEWSPAPER_MANAGER` or `DIRECTOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
    "decision": "APPROVE",
    "note": "Approved for publication schedule."
}
```

Field rules:
```
┌──────────┬──────────┬──────────────────────────────────────────────────────┐
│  Field   │ Required │                      Notes                           │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ decision │ yes      │ one of: APPROVE, REJECT, REQUEST_REVISION            │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ note     │ no       │ feedback; required when REJECT or REQUEST_REVISION    │
└──────────┴──────────┴──────────────────────────────────────────────────────┘
```

**Responses:**

`200 OK`
```json
{
    "id": "a1b2c3...",
    "status": "APPROVED_BY_MANAGER"
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have the required role, or article is not in the expected state for this role
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — article is not in the correct state for this approval step
```json
{ "error": "INVALID_ARTICLE_STATE" }
```

Side effects:
- Notifies the author by email on rejection or revision request
- Creates an audit log entry (operation: ARTICLE_APPROVED or ARTICLE_REJECTED)

---

### POST /api/newspapers/:newspaper_id/articles/:article_id/schedule

Set the publication date for a fully approved article (`APPROVED_BY_DIRECTOR`).
The article will be automatically published at the specified date and time.

**Auth required:** Yes — `NEWSPAPER_MANAGER`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
    "publication_date": "2026-05-01T08:00:00Z"
}
```

Field rules:
```
┌──────────────────┬──────────┬────────────────────────────────────────────────┐
│      Field       │ Required │                    Notes                       │
├──────────────────┼──────────┼────────────────────────────────────────────────┤
│ publication_date │ yes      │ ISO 8601 datetime; must be in the future        │
└──────────────────┴──────────┴────────────────────────────────────────────────┘
```

**Responses:**

`200 OK`
```json
{
    "id": "a1b2c3...",
    "status": "APPROVED_BY_DIRECTOR",
    "publication_date": "2026-05-01T08:00:00Z"
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have NEWSPAPER_MANAGER role in this newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — article is not in APPROVED_BY_DIRECTOR state, or date is in the past
```json
{ "error": "INVALID_PUBLICATION_DATE" }
```

Side effects:
- Creates an audit log entry (operation: ARTICLE_SCHEDULED)

---

## Search

### GET /api/newspapers/:newspaper_id/articles/search

Full-text search across articles published in a newspaper. Matches against
article title, perex, content, author name, category, and keywords. Results
are sorted by relevance descending.

**Auth required:** No (only published articles are returned)

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Query parameters:**

| Parameter         | Type    | Required | Default | Description                                |
|-------------------|---------|----------|---------|--------------------------------------------|
| q                 | string  | yes      | —       | Search query string                        |
| page              | integer | no       | 1       | Page number                                |
| limit             | integer | no       | 20      | Results per page (max 50)                  |
| category          | string  | no       | —       | Filter results to a specific category name |
| author_id         | string  | no       | —       | Filter results to a specific author UUID   |
| date_from         | string  | no       | —       | ISO 8601 date — earliest publication date  |
| date_to           | string  | no       | —       | ISO 8601 date — latest publication date    |

**Responses:**

`200 OK`
```json
{
    "data": [
        {
            "id": "a1b2c3...",
            "title": "Breaking Article",
            "perex": "Short introduction",
            "publication_date": "2026-04-10T08:00:00Z",
            "category": "Technology",
            "author": {
                "id": "u1u2u3...",
                "full_name": "Jan Novák"
            },
            "primary_image": {
                "url": "https://...",
                "caption": "Image caption"
            }
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 7,
        "total_pages": 1
    }
}
```

`400 Bad Request` — query parameter `q` is missing or empty
```json
{ "error": "MISSING_QUERY" }
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

## Categories

### GET /api/newspapers/:newspaper_id/categories

Return all categories defined for a newspaper.

**Auth required:** No

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Responses:**

`200 OK`
```json
{
    "data": [
        { "id": "cat123...", "name": "Technology", "slug": "technology" },
        { "id": "cat456...", "name": "Sport", "slug": "sport" }
    ]
}
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

### GET /api/newspapers/:newspaper_id/categories/by-slug/:slug

Return a single category by its URL slug.

**Auth required:** No

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| slug         | URL slug of the category |

**Responses:**

`200 OK`
```json
{ "id": "cat123...", "name": "Technology", "slug": "technology" }
```

`404 Not Found` — newspaper or category does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```
```json
{ "error": "CATEGORY_NOT_FOUND" }
```

---

### POST /api/newspapers/:newspaper_id/categories

Create a new category for a newspaper. Category names must be unique within
a newspaper.

**Auth required:** Yes — `NEWSPAPER_MANAGER`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{ "name": "Politics" }
```

Field rules:
```
┌───────┬──────────┬────────────────────────────────────────────────┐
│ Field │ Required │                    Notes                       │
├───────┼──────────┼────────────────────────────────────────────────┤
│ name  │ yes      │ non-empty string; unique within the newspaper  │
└───────┴──────────┴────────────────────────────────────────────────┘
```

**Responses:**

`201 Created`
```json
{ "id": "cat789...", "name": "Politics" }
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have NEWSPAPER_MANAGER role in this newspaper
```json
{ "error": "FORBIDDEN" }
```

`409 Conflict` — category name already exists in this newspaper
```json
{ "error": "CATEGORY_NAME_TAKEN" }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "name": "Name is required" }
}
```

Side effects:
- Creates an audit log entry (operation: CATEGORY_CREATED)

---

### DELETE /api/newspapers/:newspaper_id/categories/:category_id

Delete a category. Fails if any articles are currently assigned to it.

**Auth required:** Yes — `NEWSPAPER_MANAGER`

**URL parameters:**

| Parameter    | Description            |
|--------------|------------------------|
| newspaper_id | UUID of the newspaper  |
| category_id  | UUID of the category   |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`204 No Content` — category deleted successfully

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have NEWSPAPER_MANAGER role in this newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — category does not exist
```json
{ "error": "CATEGORY_NOT_FOUND" }
```

`409 Conflict` — category is assigned to one or more articles
```json
{ "error": "CATEGORY_IN_USE" }
```

Side effects:
- Creates an audit log entry (operation: CATEGORY_DELETED)

---

## Comments

### POST /api/newspapers/:newspaper_id/articles/:article_id/comments

Post a comment on a published article.

**Auth required:** Yes — `REGISTERED_USER`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{ "content": "Great article!" }
```

Field rules:
```
┌─────────┬──────────┬───────────────────────────────────────────────┐
│  Field  │ Required │                   Notes                       │
├─────────┼──────────┼───────────────────────────────────────────────┤
│ content │ yes      │ non-empty string, max 2000 characters         │
└─────────┴──────────┴───────────────────────────────────────────────┘
```

**Responses:**

`201 Created`
```json
{
    "id": "c1c2c3...",
    "content": "Great article!",
    "created_at": "2026-04-12T12:00:00Z",
    "author": {
        "id": "u4u5u6...",
        "username": "jannovak"
    }
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user belongs to a different newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist or is not published
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "content": "Comment cannot be empty" }
}
```

Side effects:
- Creates an audit log entry (operation: COMMENT_POSTED)

---

### DELETE /api/newspapers/:newspaper_id/articles/:article_id/comments/:comment_id

Delete a comment. Editors, managers, and administrators may delete any comment
for moderation purposes.

**Auth required:** Yes — comment author, `EDITOR`, `NEWSPAPER_MANAGER`, or `SYSTEM_ADMINISTRATOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |
| comment_id   | UUID of the comment   |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`204 No Content` — comment deleted successfully

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — insufficient permissions
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — comment does not exist
```json
{ "error": "COMMENT_NOT_FOUND" }
```

Side effects:
- Creates an audit log entry (operation: COMMENT_DELETED)

---

## Likes

### POST /api/newspapers/:newspaper_id/articles/:article_id/likes

Like a published article. Each user may like a given article only once.

**Auth required:** Yes — `REGISTERED_USER`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`201 Created`
```json
{ "likes_count": 43 }
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user belongs to a different newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — article does not exist or is not published
```json
{ "error": "ARTICLE_NOT_FOUND" }
```

`409 Conflict` — user has already liked this article
```json
{ "error": "ALREADY_LIKED" }
```

---

### DELETE /api/newspapers/:newspaper_id/articles/:article_id/likes

Remove the current user's like from a published article.

**Auth required:** Yes — `REGISTERED_USER`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| article_id   | UUID of the article   |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`200 OK`
```json
{ "likes_count": 42 }
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`404 Not Found` — article does not exist, or the user has not liked it
```json
{ "error": "LIKE_NOT_FOUND" }
```

---

## Newspapers

### GET /api/newspapers

Return all newspapers registered in the publishing house.

**Auth required:** Yes — `DIRECTOR`

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`200 OK`
```json
{
    "data": [
        {
            "id": "n1n2n3...",
            "name": "Daily Tech",
            "created_at": "2025-01-01T00:00:00Z"
        }
    ]
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have DIRECTOR role
```json
{ "error": "FORBIDDEN" }
```

---

### GET /api/newspapers/:newspaper_id

Return the details of a single newspaper.

**Auth required:** No

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Responses:**

`200 OK`
```json
{
    "id": "n1n2n3...",
    "name": "Daily Tech",
    "created_at": "2025-01-01T00:00:00Z"
}
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

## System Administration

### GET /api/newspapers/:newspaper_id/users

Return all users registered in a newspaper, including their roles.

**Auth required:** Yes — `SYSTEM_ADMINISTRATOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Headers:**
```
Authorization: Bearer <token>
```

**Query parameters:**

| Parameter | Type    | Required | Default | Description       |
|-----------|---------|----------|---------|-------------------|
| page      | integer | no       | 1       | Page number       |
| limit     | integer | no       | 50      | Users per page (max 100) |

**Responses:**

`200 OK`
```json
{
    "data": [
        {
            "id": "u1u2u3...",
            "email": "jan.novak@example.com",
            "username": "jannovak",
            "full_name": "Jan Novák",
            "roles": ["REGISTERED_USER", "AUTHOR"],
            "email_verified": true
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 50,
        "total": 120,
        "total_pages": 3
    }
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have SYSTEM_ADMINISTRATOR role
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

### POST /api/newspapers/:newspaper_id/users/:user_id/roles

Assign a role to a user within a newspaper. A user may hold multiple roles.
When a content administrator role (`AUTHOR`, `EDITOR`, `NEWSPAPER_MANAGER`) is
assigned to a user who does not yet have a profile picture and bio, they will
be required to complete their profile on next login.

**Auth required:** Yes — `SYSTEM_ADMINISTRATOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| user_id      | UUID of the user      |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{ "role": "AUTHOR" }
```

Field rules:
```
┌───────┬──────────┬──────────────────────────────────────────────────────────────────────┐
│ Field │ Required │                              Notes                                   │
├───────┼──────────┼──────────────────────────────────────────────────────────────────────┤
│ role  │ yes      │ one of: REGISTERED_USER, AUTHOR, EDITOR, NEWSPAPER_MANAGER, DIRECTOR │
└───────┴──────────┴──────────────────────────────────────────────────────────────────────┘
```

**Responses:**

`200 OK`
```json
{
    "user_id": "u1u2u3...",
    "roles": ["REGISTERED_USER", "AUTHOR"]
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have SYSTEM_ADMINISTRATOR role
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — user or newspaper does not exist
```json
{ "error": "USER_NOT_FOUND" }
```

`409 Conflict` — user already has this role
```json
{ "error": "ROLE_ALREADY_ASSIGNED" }
```

`422 Unprocessable Entity` — unrecognized role value
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "role": "Invalid role" }
}
```

Side effects:
- Creates an audit log entry (operation: ROLE_ASSIGNED)

---

### DELETE /api/newspapers/:newspaper_id/users/:user_id/roles/:role

Remove a role from a user within a newspaper.

**Auth required:** Yes — `SYSTEM_ADMINISTRATOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| user_id      | UUID of the user      |
| role         | Role name to remove   |

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`200 OK`
```json
{
    "user_id": "u1u2u3...",
    "roles": ["REGISTERED_USER"]
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have SYSTEM_ADMINISTRATOR role
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — user does not exist or does not hold the specified role
```json
{ "error": "ROLE_NOT_FOUND" }
```

`422 Unprocessable Entity` — cannot remove REGISTERED_USER role (base role is permanent)
```json
{ "error": "CANNOT_REMOVE_BASE_ROLE" }
```

Side effects:
- Creates an audit log entry (operation: ROLE_REMOVED)

---

## Author Article Dashboard

### GET /api/newspapers/:newspaper_id/articles/mine

Return a paginated list of all articles created by the currently authenticated
author within a newspaper, regardless of status. Used to populate the author's
dashboard and to allow tracking of article progress through the review pipeline
(View Articles Status use case).

**Auth required:** Yes — `AUTHOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Headers:**
```
Authorization: Bearer <token>
```

**Query parameters:**

| Parameter | Type    | Required | Default | Description                                                                                   |
|-----------|---------|----------|---------|-----------------------------------------------------------------------------------------------|
| page      | integer | no       | 1       | Page number                                                                                   |
| limit     | integer | no       | 20      | Articles per page (max 50)                                                                    |
| status    | string  | no       | —       | Filter by status: DRAFT, SUBMITTED, IN_REVIEW, APPROVED_BY_EDITOR, APPROVED_BY_MANAGER, APPROVED_BY_DIRECTOR, PUBLISHED, REJECTED |

**Responses:**

`200 OK`
```json
{
    "data": [
        {
            "id": "a1b2c3...",
            "title": "My Draft Article",
            "perex": "Short introduction",
            "category": "Technology",
            "status": "IN_REVIEW",
            "created_at": "2026-04-01T10:00:00Z",
            "updated_at": "2026-04-05T14:00:00Z",
            "assigned_editor": {
                "id": "u7u8u9...",
                "full_name": "Eva Editorová"
            },
            "latest_feedback": "Please expand the introduction section."
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 5,
        "total_pages": 1
    }
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have AUTHOR role in this newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

## Editorial Workflow Queue

### GET /api/newspapers/:newspaper_id/articles/queue

Return a paginated list of articles that are pending action from the
authenticated user based on their role. The returned articles and
permitted statuses are automatically scoped to the caller's role:

- `EDITOR`: returns articles in `IN_REVIEW` that are assigned to the calling editor
- `NEWSPAPER_MANAGER`: returns articles in `SUBMITTED` (awaiting editor assignment) and `APPROVED_BY_EDITOR` (awaiting manager approval)
- `DIRECTOR`: returns articles in `APPROVED_BY_MANAGER` (awaiting director approval)

This endpoint drives the Review Submitted Articles, Approve Editor-Reviewed
Articles, and Approve Newspaper Publication use cases.

**Auth required:** Yes — `EDITOR`, `NEWSPAPER_MANAGER`, or `DIRECTOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Headers:**
```
Authorization: Bearer <token>
```

**Query parameters:**

| Parameter | Type    | Required | Default | Description                          |
|-----------|---------|----------|---------|--------------------------------------|
| page      | integer | no       | 1       | Page number                          |
| limit     | integer | no       | 20      | Articles per page (max 50)           |
| status    | string  | no       | —       | Further filter within the role's allowed statuses |

**Responses:**

`200 OK`
```json
{
    "data": [
        {
            "id": "a1b2c3...",
            "title": "Breaking Article",
            "perex": "Short introduction",
            "category": "Technology",
            "status": "IN_REVIEW",
            "submitted_at": "2026-04-09T08:00:00Z",
            "author": {
                "id": "u1u2u3...",
                "full_name": "Jan Novák"
            },
            "assigned_editor": {
                "id": "u7u8u9...",
                "full_name": "Eva Editorová"
            }
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 3,
        "total_pages": 1
    }
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have an editorial role in this newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

## Categories

### PUT /api/newspapers/:newspaper_id/categories/:category_id

Update the name of an existing category. The new name must be unique within
the newspaper.

**Auth required:** Yes — `NEWSPAPER_MANAGER`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |
| category_id  | UUID of the category  |

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{ "name": "International Politics" }
```

Field rules:
```
┌───────┬──────────┬────────────────────────────────────────────────┐
│ Field │ Required │                    Notes                       │
├───────┼──────────┼────────────────────────────────────────────────┤
│ name  │ yes      │ non-empty string; unique within the newspaper  │
└───────┴──────────┴────────────────────────────────────────────────┘
```

**Responses:**

`200 OK`
```json
{ "id": "cat123...", "name": "International Politics" }
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have NEWSPAPER_MANAGER role in this newspaper
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — category does not exist
```json
{ "error": "CATEGORY_NOT_FOUND" }
```

`409 Conflict` — a category with the new name already exists in this newspaper
```json
{ "error": "CATEGORY_NAME_TAKEN" }
```

`422 Unprocessable Entity` — validation failed
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "name": "Name cannot be empty" }
}
```

Side effects:
- Creates an audit log entry (operation: CATEGORY_UPDATED)

---

## Comment Moderation

### GET /api/newspapers/:newspaper_id/comments

Return a paginated list of all comments across all articles in a newspaper.
Used by administrators and editors to power the comment moderation panel.

**Auth required:** Yes — `EDITOR`, `NEWSPAPER_MANAGER`, or `SYSTEM_ADMINISTRATOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Headers:**
```
Authorization: Bearer <token>
```

**Query parameters:**

| Parameter  | Type    | Required | Default | Description                              |
|------------|---------|----------|---------|------------------------------------------|
| page       | integer | no       | 1       | Page number                              |
| limit      | integer | no       | 50      | Comments per page (max 100)              |
| article_id | string  | no       | —       | Filter comments to a specific article UUID |

**Responses:**

`200 OK`
```json
{
    "data": [
        {
            "id": "c1c2c3...",
            "content": "This is a comment.",
            "created_at": "2026-04-10T09:00:00Z",
            "author": {
                "id": "u4u5u6...",
                "username": "petrnovak"
            },
            "article": {
                "id": "a1b2c3...",
                "title": "Breaking Article"
            }
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 50,
        "total": 210,
        "total_pages": 5
    }
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — insufficient permissions
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

## Statistics

### GET /api/newspapers/:newspaper_id/statistics

Return publication statistics for a newspaper. Used by directors and managers
to review performance metrics (Review Publication Statistics use case).

**Auth required:** Yes — `NEWSPAPER_MANAGER` or `DIRECTOR`

**URL parameters:**

| Parameter    | Description           |
|--------------|-----------------------|
| newspaper_id | UUID of the newspaper |

**Headers:**
```
Authorization: Bearer <token>
```

**Query parameters:**

| Parameter  | Type   | Required | Default | Description                                   |
|------------|--------|----------|---------|-----------------------------------------------|
| date_from  | string | no       | —       | ISO 8601 date — start of the reporting window |
| date_to    | string | no       | —       | ISO 8601 date — end of the reporting window   |

**Responses:**

`200 OK`
```json
{
    "newspaper_id": "n1n2n3...",
    "period": {
        "from": "2026-01-01T00:00:00Z",
        "to": "2026-04-12T00:00:00Z"
    },
    "articles": {
        "total_published": 84,
        "total_draft": 12,
        "total_in_review": 5,
        "total_rejected": 3,
        "published_by_category": [
            { "category": "Technology", "count": 30 },
            { "category": "Sport", "count": 22 }
        ],
        "published_by_author": [
            { "author_id": "u1u2u3...", "full_name": "Jan Novák", "count": 18 }
        ]
    },
    "engagement": {
        "total_comments": 430,
        "total_likes": 1280
    },
    "publication_timeline": [
        { "date": "2026-04-10", "published_count": 3 },
        { "date": "2026-04-11", "published_count": 5 }
    ]
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have the required role
```json
{ "error": "FORBIDDEN" }
```

`404 Not Found` — newspaper does not exist
```json
{ "error": "NEWSPAPER_NOT_FOUND" }
```

---

## System Configuration

### GET /api/admin/config

Retrieve the current system-wide configuration settings. Used by the system
administrator to review active configuration (Manage System Configuration use case).

**Auth required:** Yes — `SYSTEM_ADMINISTRATOR`

**Headers:**
```
Authorization: Bearer <token>
```

**Responses:**

`200 OK`
```json
{
    "email": {
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "sender_address": "no-reply@example.com"
    },
    "security": {
        "jwt_expiry_hours": 24,
        "password_reset_token_expiry_minutes": 60,
        "verification_token_expiry_hours": 48,
        "max_login_attempts": 5
    },
    "uploads": {
        "max_image_size_mb": 10,
        "allowed_image_types": ["image/jpeg", "image/png"]
    }
}
```

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have SYSTEM_ADMINISTRATOR role
```json
{ "error": "FORBIDDEN" }
```

---

### PUT /api/admin/config

Update one or more system-wide configuration settings. Only the supplied keys
are updated; omitted keys retain their current values.

**Auth required:** Yes — `SYSTEM_ADMINISTRATOR`

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
    "email": {
        "smtp_host": "smtp.newprovider.com",
        "smtp_port": 465,
        "sender_address": "news@example.com"
    },
    "security": {
        "jwt_expiry_hours": 48
    }
}
```

All top-level sections and their fields are optional. Only provided values are
overwritten.

**Responses:**

`200 OK` — returns the full updated configuration in the same shape as `GET /api/admin/config`

`401 Unauthorized` — no token provided
```json
{ "error": "UNAUTHORIZED" }
```

`403 Forbidden` — user does not have SYSTEM_ADMINISTRATOR role
```json
{ "error": "FORBIDDEN" }
```

`422 Unprocessable Entity` — validation failed (e.g., invalid port number)
```json
{
    "error": "VALIDATION_ERROR",
    "fields": { "email.smtp_port": "Must be a valid port number (1–65535)" }
}
```

Side effects:
- Changes take effect immediately for new requests
- Creates an audit log entry (operation: SYSTEM_CONFIG_UPDATED)

---

## Article State Machine

For reference, the full article lifecycle is as follows:

```
[*] --> Draft            : author creates article
Draft --> Submitted      : author submits for review
Submitted --> InReview   : manager assigns an editor
InReview --> Draft       : editor requests revisions
InReview --> Rejected    : editor rejects
InReview --> ApprovedByEditor   : editor approves
ApprovedByEditor --> Draft      : manager requests revisions
ApprovedByEditor --> Rejected   : manager rejects
ApprovedByEditor --> ApprovedByManager  : manager approves
ApprovedByManager --> Draft     : director requests revisions
ApprovedByManager --> Rejected  : director rejects
ApprovedByManager --> ApprovedByDirector : director approves
ApprovedByDirector --> Published : scheduled publication time reached
Published --> [*]
```

---

## Role Reference

| Role                 | Scope      | Description                                                      |
|----------------------|------------|------------------------------------------------------------------|
| REGISTERED_USER      | Newspaper  | Default role; can read articles, comment, and like               |
| AUTHOR               | Newspaper  | Can create, edit, and submit articles                            |
| EDITOR               | Newspaper  | Reviews and approves/rejects submitted articles                  |
| NEWSPAPER_MANAGER    | Newspaper  | Manages editors, categories, schedules, and final newspaper approvals |
| DIRECTOR             | Global     | Gives final publication approval across all newspapers           |
| SYSTEM_ADMINISTRATOR | Global     | Manages users and role assignments                               |
