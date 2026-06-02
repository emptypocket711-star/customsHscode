# Marketplace Notification Preference Plan

This plan fixes the user-level notification preference policy before enabling external marketplace emails in production.

## Scope

This plan covers marketplace request opportunity notifications for partner users.

It does not change:

- in-app notification inbox behavior
- partner matching rules
- `partner_preferences.notification_enabled`
- transactional email provider implementation
- production send enablement

## Decision

Marketplace opportunity emails must be user opt-in.

In-app notifications remain the default operational surface for matched partner companies. External email is an additional channel and should not be sent merely because a partner company matched a request.

## Why This Differs From Partner Preferences

`partner_preferences.notification_enabled` is a company-level matching and exposure preference. It answers whether a partner company wants matching notifications generated for relevant requests.

User email preference answers a different question: whether a specific user inside that partner company wants marketplace notification emails delivered to their email address.

Do not use `partner_preferences.notification_enabled` as user email consent.

## MVP Policy

1. Matched partner companies continue to receive in-app marketplace notifications.
2. Marketplace email notifications are disabled by default for each user.
3. A user can enable marketplace email notifications from authenticated settings after the preference schema exists.
4. A user can disable marketplace email notifications from authenticated settings.
5. Missing preference rows must be treated as `email disabled`.
6. The first production email footer should point users to authenticated notification settings.
7. Public unsubscribe links are deferred until token storage, audit logging, and abuse handling are designed.

## Notification Kinds

Start with these kinds:

- `initial`: a newly published request matched the partner company.
- `deadline_reminder`: a matched request is approaching its response deadline.

Do not add broad marketing, newsletter, or promotional notification kinds to this marketplace operational channel.

## Schema Direction

Prefer a separate preference table instead of adding one boolean to `profiles`.

Recommended table:

```text
marketplace_notification_preferences
  id uuid primary key
  profile_id uuid references profiles(id) on delete cascade
  channel text
  notification_kind text
  enabled boolean
  created_at timestamptz
  updated_at timestamptz
  unique(profile_id, channel, notification_kind)
```

Initial constraints:

- `channel in ('email')`
- `notification_kind in ('initial', 'deadline_reminder')`
- missing row means disabled

This keeps future in-app, SMS, digest, and per-kind preferences possible without conflating product settings with partner matching rules.

## RLS Direction

RLS should allow:

- authenticated users to read and update only their own preference rows
- service-role jobs to read preferences while resolving recipients
- developer/staff read access only where existing operations policy permits

RLS should not allow:

- one company admin to silently opt another user into email
- partner users to read other users' email preference rows
- anonymous unsubscribe mutations before token-based unsubscribe is explicitly designed

## Resolver Direction

The marketplace email recipient resolver should:

1. find eligible partner company users
2. load their marketplace email preferences
3. keep only recipients with `enabled = true` for the requested notification kind
4. still exclude invalid email, developer profiles, other-company profiles, and onboarding-incomplete users
5. return admin users first, then members, ordered by email

The current provider should send to one selected recipient only.

## Fanout Decision

Do not enable multi-recipient external email fanout for MVP.

If several users in the same partner company opt in, the provider should keep the current admin-first single-recipient behavior. This reduces duplicate inbox pressure, avoids several people responding to the same opportunity without a company assignment model, and keeps delivery status company-scoped.

In-app notifications remain the shared operational surface. Team-wide fanout can be revisited after the app has:

- per-user delivery rows or per-user read state for email
- company-level assignment or owner routing for opportunities
- unsubscribe and audit support for public email links
- volume telemetry for duplicate responses and notification fatigue

## Deferred Items

- public unsubscribe token table
- unsubscribe audit event
- company-admin bulk email preference management
- multi-recipient fanout
- digest email batching
- branded email templates
- production email rehearsal

## Next Implementation Step

P122 should review whether production email rehearsal can run with a real provider in a controlled allowlisted test mailbox after sender identity, domain authentication, and recipient safety are verified.
