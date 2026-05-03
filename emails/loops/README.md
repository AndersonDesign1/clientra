# Clientra Loops Transactional Emails

These MJML templates are the code-owned source for Clientra's Loops transactional emails. Loops still requires each transactional email to be created, imported, and published in the Loops dashboard before the API can send it.

The visual direction follows the product dashboard: neutral near-white page background, white bordered cards, compact Geist-style typography, 8px radius, restrained green primary actions, and small event accents for activity types.

## Setup

1. In Loops, create a new transactional email.
2. Choose the custom MJML import option.
3. Paste the matching `.mjml` file from this folder.
4. Publish the email.
5. Copy the Transactional ID into the matching environment variable.

## Template Map

| File | Environment variable |
| --- | --- |
| `invite.mjml` | `LOOPS_INVITE_TRANSACTIONAL_ID` |
| `project-update.mjml` | `LOOPS_PROJECT_UPDATE_TRANSACTIONAL_ID` |
| `file-uploaded.mjml` | `LOOPS_FILE_UPLOADED_TRANSACTIONAL_ID` |
| `comment.mjml` | `LOOPS_COMMENT_TRANSACTIONAL_ID` |
| `verify-email.mjml` | `LOOPS_VERIFY_EMAIL_TRANSACTIONAL_ID` |
| `reset-password.mjml` | `LOOPS_RESET_PASSWORD_TRANSACTIONAL_ID` |

## Data Variables

Loops variables are case-sensitive. Keep these names exactly as written.

### Invite

- `appUrl`
- `clientCompany`
- `clientName`
- `inviteUrl`
- `recipientEmail`

### Project Update

- `actorName`
- `appUrl`
- `clientCompany`
- `clientName`
- `projectTitle`
- `recipientEmail`
- `recipientName`
- `updatePreview`
- `updateStatus`
- `updateTitle`

### File Uploaded

- `actorName`
- `appUrl`
- `clientCompany`
- `clientName`
- `fileName`
- `projectTitle`
- `recipientEmail`
- `recipientName`

### Comment

- `actorName`
- `appUrl`
- `clientCompany`
- `clientName`
- `commentPreview`
- `projectTitle`
- `recipientEmail`
- `recipientName`

### Email Verification

- `token`
- `verificationUrl`

### Password Reset

- `resetPasswordUrl`
- `token`

## Suggested Subjects

- Invite: `You're invited to Clientra`
- Project update: `New update for {DATA_VARIABLE:projectTitle}`
- File uploaded: `New file uploaded for {DATA_VARIABLE:projectTitle}`
- Comment: `New comment on {DATA_VARIABLE:projectTitle}`
- Email verification: `Verify your Clientra email`
- Password reset: `Reset your Clientra password`
