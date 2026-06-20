# Image Upload Configuration Guide

Use Cloudinary or another server-signed upload provider.

Validation checklist:

- Accept only image MIME types needed by the storefront.
- Enforce maximum file size.
- Enforce sensible dimensions.
- Store alt text.
- Keep signed upload secrets on the server.
- Save URLs in `ProductImage`, `Banner`, `HomepageSection`, `SiteSetting`, or user profile fields.
