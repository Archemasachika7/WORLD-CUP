# Live Scores & Bracket Fixes — World Cup 2026 Hub

## Overview

This document describes the fixes applied to resolve live scores not appearing on the site and the integration of a free, reputed API for World Cup 2026 match data and brackets.

## Problems Fixed

### 1. **Live Scores Not Appearing**
- **Root Cause**: The `fetchLiveMatches()` and `fetchStandings()` functions in `js/api.js` were returning `null` with no actual API integration.
- **Solution**: Implemented a Supabase Edge Function (`scores-proxy`) that proxies requests to the free **football-data.org API**, which includes World Cup 2026 data in its free tier.

### 2. **Bracket Predictions Not Persisting**
- **Root Cause**: The frontend was writing to non-existent tables (`predictions`, `profiles`) instead of the actual schema (`bracket_predictions`, `user_profiles`).
- **Solution**: 
  - Updated `bracket.html` to use the correct table name `bracket_predictions`
  - Fixed column name mappings (`fav_team` → `favorite_nation`, etc.)
  - Added `runner_up` column support to the database schema

### 3. **Missing Runner-up Predictions**
- **Root Cause**: The bracket schema only supported `champion`, not `runner_up`.
- **Solution**: Created migration `002_add_runner_up_and_fix_tables.sql` to add the `runner_up` column.

## Architecture

### Supabase Edge Function: `scores-proxy`

**Location**: `/supabase/functions/scores-proxy/index.ts`

**Purpose**: Acts as a proxy to the football-data.org API, handling:
- CORS headers for browser requests
- API key management (via environment variable `FD_KEY`)
- Caching headers (5-minute cache for live scores)
- Error handling and fallback responses

**Endpoints**:
- `GET /api/scores-proxy?endpoint=competitions/WC/matches` → Fetch all World Cup 2026 matches with live scores
- `GET /api/scores-proxy?endpoint=competitions/WC/standings` → Fetch group standings and brackets

**Example Response** (matches):
```json
{
  "matches": [
    {
      "id": 123456,
      "homeTeam": { "id": 1, "name": "Argentina", "code": "ARG" },
      "awayTeam": { "id": 2, "name": "Brazil", "code": "BRA" },
      "score": {
        "fullTime": { "home": 2, "away": 1 }
      },
      "status": "FINISHED",
      "utcDate": "2026-06-21T20:00:00Z"
    }
  ]
}
```

### Frontend Integration

#### 1. **Updated `js/api.js`**
- `fetchLiveMatches()` → Calls `/api/scores-proxy?endpoint=competitions/WC/matches`
- `fetchStandings()` → Calls `/api/scores-proxy?endpoint=competitions/WC/standings`
- `startLiveScoresAutoRefresh(callback)` → Auto-refreshes every 30 seconds during tournament
- Implements client-side caching with 5-minute TTL

#### 2. **New `js/live-scores.js`**
- `LiveScores.init()` → Initializes live score updates on page load
- `updateScoresDisplay(matches)` → Updates match cards with live scores
- `formatScore(match)` → Formats score for display
- `getStatusBadge(match)` → Returns match status (LIVE 🔴, FT ✓, UPCOMING ⏰)

#### 3. **Updated `bracket.html`**
- Fixed `loadPredictions()` to query `bracket_predictions` table
- Fixed `savePredictions()` to use correct column names
- Added support for `runner_up` predictions

#### 4. **Updated `matches.html`**
- Added script includes for `api.js` and `live-scores.js`
- Live scores now auto-update every 30 seconds

## Database Schema

### `bracket_predictions` Table
```sql
CREATE TABLE public.bracket_predictions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  fav_team      TEXT,                    -- User's favorite nation
  group_winners JSONB DEFAULT '{}'::jsonb, -- Group stage predictions
  champion      TEXT,                    -- World Cup winner prediction
  runner_up     TEXT,                    -- Runner-up prediction (NEW)
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## API Integration Details

### Football-Data.org
- **Free Tier**: ✅ Includes World Cup 2026 (competition code: `WC`)
- **Rate Limit**: 10 requests/minute (free tier)
- **Data Available**:
  - All 104 World Cup 2026 matches
  - Live scores during tournament (June 11 — July 19, 2026)
  - Group standings and final brackets
  - Team lineups, substitutions, and match events

### Why Football-Data.org?
1. **Free Forever**: No credit card required, free tier includes World Cup 2026
2. **Reliable**: Established API with 10+ years of football data
3. **Comprehensive**: Covers all matches, scores, standings, and player data
4. **Real-time**: Updates during live matches
5. **No Authentication Needed**: Public API (though API key recommended for higher limits)

## Deployment Instructions

### 1. **Set Environment Variable**
In your Supabase project settings, add:
```
FD_KEY=your_football_data_org_api_key_here
```

(Optional: If not set, the proxy will still work but with lower rate limits)

### 2. **Run Database Migrations**
In Supabase Dashboard → SQL Editor, run:
1. `supabase/migrations/001_bracket_predictor.sql` (if not already run)
2. `supabase/migrations/002_add_runner_up_and_fix_tables.sql`

### 3. **Deploy Edge Function**
```bash
supabase functions deploy scores-proxy
```

### 4. **Update Frontend**
- All frontend files have been updated and are ready to deploy
- No additional configuration needed

## Testing

### Test Live Scores
1. Open `matches.html` in browser
2. Check browser console for API calls
3. Verify match scores appear and update every 30 seconds

### Test Bracket Predictions
1. Open `bracket.html`
2. Sign in with email (magic link)
3. Pick a nation
4. Select group winners and champion
5. Click "Save Predictions"
6. Verify data persists after page reload

## Troubleshooting

### Live Scores Not Updating
1. Check browser console for errors
2. Verify Supabase Edge Function is deployed: `supabase functions list`
3. Check that `FD_KEY` environment variable is set
4. Verify football-data.org API is accessible: `curl https://api.football-data.org/v4/competitions/WC/matches`

### Bracket Predictions Not Saving
1. Verify user is signed in
2. Check browser console for Supabase errors
3. Verify `bracket_predictions` table exists: `SELECT * FROM bracket_predictions LIMIT 1;`
4. Check Row-Level Security (RLS) policies are enabled

### CORS Errors
1. Verify `CORS_HEADERS` are set in `scores-proxy/index.ts`
2. Test with curl: `curl -H "Origin: *" https://your-supabase-url/functions/v1/scores-proxy`

## Future Enhancements

1. **Real-time WebSocket Updates**: Replace polling with WebSocket for instant updates
2. **Player Statistics**: Add player goal/assist tracking
3. **Match Predictions**: ML-based win probability updates during live matches
4. **Notifications**: Push notifications for goals and match milestones
5. **Bracket Leaderboard**: Compare predictions with other users

## Files Modified

- ✅ `js/api.js` — Added live scores fetching
- ✅ `js/live-scores.js` — New module for score display
- ✅ `bracket.html` — Fixed Supabase queries and table names
- ✅ `matches.html` — Added live scores script includes
- ✅ `supabase/functions/scores-proxy/index.ts` — New Edge Function
- ✅ `supabase/functions/scores-proxy/deno.json` — Function config
- ✅ `supabase/migrations/002_add_runner_up_and_fix_tables.sql` — New migration

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review football-data.org documentation: https://www.football-data.org/documentation/api
3. Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
