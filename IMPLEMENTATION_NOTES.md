# Implementation Notes - Article Popularity & Hero Management

## Recent Changes

### 1. Article View Tracking
- Added `view_count` column to `articles` table (default: 0)
- New endpoint: `POST /api/articles/:id/view` - increments view count
- Views are automatically tracked when visiting `/voyage/:slug`
- Public display of view count with 1-5 popularity bars (★☆)

### 2. Hero Image Management
- Added `DELETE /api/settings/hero-image` endpoint (admin only)
- Admin can now delete hero image while keeping design beautiful (gradient)
- Delete button appears in admin settings only when image exists
- Confirmation dialog before deletion

### 3. Frontend Popularity Display
- Helper function `renderPopularityBars(views, minViews, maxViews)`
- Calculates bars 1-5 based on relative popularity
- Formula: `Math.max(1, Math.ceil((views - min) / (max - min + 1) * 5))`
- Displays next to "Lire la suite" on article cards

### 4. Vercel Frontend Preparation
- Created `.env.local.example` with API URL config
- Created `frontend/api.js` - reusable API client with env support
- Ready for standalone React/Vue frontend deployment

## Migration Steps

### For Existing Databases

1. **Add view_count column to existing database:**
   ```bash
   wrangler d1 execute tranquille-vacances-db --file=backend/migrations/001-add-view-count.sql
   ```

### For New Databases

Just use the updated `schema.sql` - view_count is included by default.

## API Changes

### New Endpoints

**POST `/api/articles/:id/view`**
- Public, anonymous
- Increments article view count by 1
- Returns: `{ views: number }`
- Example: `POST /api/articles/123/view` or `POST /api/articles/my-trip-slug/view`

**DELETE `/api/settings/hero-image`**
- Admin only
- Clears hero_image_url and hero_image_r2_key
- Deletes R2 object
- Returns: `{ success: true }`

## Frontend Variables (Vercel)

Create `.env.local` in `frontend/` folder:

```env
VITE_API_URL=https://your-api.workers.dev
VITE_PUBLIC_URL=https://your-api.workers.dev
```

For local development:
```env
VITE_API_URL=http://localhost:8787
VITE_PUBLIC_URL=http://localhost:8787
```

## Files Modified

- `schema.sql` - added view_count to articles table
- `backend/schema.sql` - same changes
- `backend/migrations/001-add-view-count.sql` - migration script
- `backend/worker/api/articles.js` - added recordView function
- `backend/worker/api/photos.js` - added deleteHeroImage function
- `backend/worker/index.js` - added routes, view tracking on page load
- `backend/worker/pages/home.js` - added popularity bars display
- `backend/worker/pages/admin.js` - added delete hero image UI
- `frontend/.env.local.example` - env config template
- `frontend/api.js` - API client

## Testing

1. **Test view counting:**
   - Visit `/voyage/any-article`
   - Check browser network tab - `POST /api/articles/xxx/view` should fire
   - Refresh page - view count should increment in database

2. **Test popularity bars:**
   - Visit home page
   - Articles should show 1-5 stars based on relative views
   - Most viewed = 5 stars, least viewed = 1 star

3. **Test hero management:**
   - Go to admin settings
   - Click "Importer une image" and select image
   - Preview should appear and "Supprimer" button should show
   - Click delete and confirm
   - Button hides, preview disappears

## Notes

- Hero section still looks beautiful with just gradient (no image)
- Admin toolbar on home page (when logged in) also allows hero image upload
- View tracking is fire-and-forget (no error handling for failures)
- Popularity calculation handles edge case of all articles with 0 views (all show 1 star)
