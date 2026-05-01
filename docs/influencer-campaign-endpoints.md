Influencer Campaign Endpoints

Base path: /campaigns/influencer

All endpoints require Authorization Bearer jwt and an authenticated influencer user.


Resolved campaign status

Every endpoint that returns a campaign card includes a status field, which is a resolved value (not the raw DB status).

application_period means the campaign is approved or pending_minimum.
implementation means the campaign is implementation.
completed means the campaign is completed.
discarded means the campaign is discarded.

Use this field on the front end. Do not compute it yourself.


Campaign card shape

Used by every endpoint as the primary response item, or as the embedded campaign field on applications and invitations.

id is a string.
campaignNumber is a number.
name is a string.
description is a string.
status is one of application_period, implementation, completed, discarded.
relevantDeadline is an ISO date string or null.
includedPlatforms is an array of strings, for example instagram, tiktok.
contentTypes is an array of strings, for example reel, story.
influencerPrice is a number in SAR.

The relevantDeadline is auto picked based on the underlying status.
When approved, it is the deadlineDate.
When pending_minimum, it is the pendingMinimumDeadline.
When implementation, it is the implementationEndDate.
When completed or discarded, it is null.


Common query filters

All four endpoints accept the same set of filters. Everything is optional unless noted.

page is a number, default 1.
limit is a number, default 10.
search is a string. It matches the campaign name. If numeric, it also matches the campaignNumber.
categoryId is a uuid.
platform is one of TargetPlatform.
contentType is one of ContentTypeOffer.
implementationType is one of ImplementationType.
implementationPeriodDays is a number, exact match.
priceFrom is a number.
priceTo is a number.

Pagination shape returned on every endpoint.
data is the array of items.
pagination contains total, page, and limit.


1. GET /campaigns/influencer/new

Returns public campaigns the influencer has not applied to yet. Use this to power the discover and apply feed.

It only returns campaigns with status approved or pending_minimum, public visibility, and a deadline that has not passed.
It excludes any campaign where the user already has an application of any status.
It is ordered by relevance match against the user services and categories, then by createdAt descending.

Query supports only the common filters listed above.

The response item is a campaign card.

Example response.
data contains one item with id, campaignNumber 42, name حملة عطور الصيف, description, status application_period, relevantDeadline 2026-05-12, includedPlatforms instagram and tiktok, contentTypes reel and story, influencerPrice 1080.
pagination has total 17, page 1, limit 10.


2. GET /campaigns/influencer/my

Returns campaigns the influencer is part of, filtered by the resolved status.

Required query is status, which is one of all, application_period, implementation, completed, discarded. Common filters are also supported.

Membership rules. In every case, the user must have an accepted application or an accepted invitation on the campaign.
When status is all, returns every such campaign regardless of its underlying state.
When status is application_period, returns campaigns where the user CampaignApplication is accepted and the campaign is approved or pending_minimum. Public only. Private campaigns never enter this state.
When status is implementation, returns campaigns where the campaign is implementation and the user has either an accepted application or an accepted invitation.
When status is completed, returns campaigns where the campaign is completed and the user has an accepted application or invitation.
When status is discarded, returns campaigns where the campaign is discarded and the user has an accepted application or invitation.

The response item is a plain campaign card with no application or invitation object.

Example call.
GET /campaigns/influencer/my with status equals implementation.
data contains one item with id, campaignNumber 51, name, status implementation, and the rest of the card fields.
pagination has total 2, page 1, limit 10.


3. GET /campaigns/influencer/applications

Returns every application the influencer has submitted, with any status. Use this for the my applications tab.

Query supports only common filters.

The response item shape.
id is the application id.
status is one of pending, accepted, rejected.
createdAt is an ISO timestamp.
campaign is the campaign card.

Example response.
data contains one item.
The application has id app-uuid, status accepted, createdAt 2026-04-21T09:14:00.000Z, and an embedded campaign with id, campaignNumber 33, name حملة منتجات اللياقة, status application_period, relevantDeadline 2026-05-09, includedPlatforms instagram, contentTypes reel, influencerPrice 800.
pagination has total 6, page 1, limit 10.


4. GET /campaigns/influencer/invitations

Returns pending invitations only. These are invitations the user has not yet accepted or rejected. Use this for the incoming invitations tab.

Query supports only common filters.

The response item has the same wrapper shape as applications.
id is the invitation id.
status is always pending here.
createdAt is an ISO timestamp.
campaign is the campaign card.

Once the influencer responds with POST /campaigns/influencer/invitations/:campaignId/accept or POST /campaigns/influencer/invitations/:campaignId/reject, the invitation drops out of this list.


Existing related endpoints, unchanged.

GET /campaigns/influencer/:id returns the full campaign detail. It also returns the resolved status.
POST /campaigns/influencer/:id/apply applies to a public campaign from the new feed.
POST /campaigns/influencer/:id/submit submits content as multipart.
POST /campaigns/influencer/invitations/:campaignId/accept accepts a pending invitation.
POST /campaigns/influencer/invitations/:campaignId/reject rejects a pending invitation.


Quick UI mapping.

The discover and apply feed maps to GET /new.
My campaigns all maps to GET /my with status all.
My campaigns application period maps to GET /my with status application_period.
My campaigns in implementation maps to GET /my with status implementation.
My campaigns completed maps to GET /my with status completed.
My campaigns discarded maps to GET /my with status discarded.
My applications maps to GET /applications.
Incoming invitations maps to GET /invitations.
Campaign detail page maps to GET /:id.
