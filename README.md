# ProZone

ProZone is a real-estate discovery app built with Expo, Expo Router, React
Native, NativeWind, and Supabase. Seeker, owner, and agent accounts use Supabase
Auth; listings, saved properties, inquiries, and inspection requests are stored
in Supabase Postgres and protected by row-level security. Listing photos are
uploaded to Supabase Storage.

## Connect Supabase

1. Create a Supabase project and keep its database password private.
2. In the project dashboard, open **Connect** and copy the project URL and
   publishable key (the legacy anon key is also supported).
3. Copy `.env.example` to `.env.local` and set:

   ```text
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

   On Windows PowerShell, run `Copy-Item .env.example .env.local`.
4. In the Supabase SQL Editor, apply the migrations in timestamp order.
   For a new project, run `20261106000000_initial_schema.sql`,
   `20261106000100_secure_profile_roles.sql`,
   `20261106000200_admin_approval_system.sql`, then
   `20261107000100_secure_role_verification.sql`. If the earlier migrations
   are already applied, run only the verification migration.
5. Add the app's password-recovery redirect URL (`zone://reset-password`) to
   **Authentication → URL Configuration → Redirect URLs**. For web builds,
   add the deployed web URL's `/reset-password` route as well.
6. Restart Expo after changing `.env.local`:

   ```bash
   npm install
   npm run start
   ```

Never put the database password or a service-role key in the app. The client
uses only the publishable/anon key; database access is restricted by RLS.

## Included flows

- Email account creation, sign-in, password recovery, and profile editing
- An administrator dashboard for user totals and agent/owner role requests
- Seeker accounts can request owner or agent access; an administrator must
  approve the request before the profile role changes
- Property discovery, filtering, details, and saved-property sync
- Owner/agent listing creation, image upload, status changes, and removal
- Seeker inquiries and inspection requests, with owner/agent response and
  status tracking
- Postgres policies and triggers for participant access, listing ownership,
  recipient assignment, and status transitions

## Administrator setup and role requests

New sign-ups always receive the `seeker` profile role. Selecting Agent or Owner
at sign-up records only a pending request; it does not grant listing access.
Only an administrator role recorded in `profiles` can view or decide requests.
The administrator dashboard calls database functions that verify this role;
approval changes the profile and request status together, and a request can be
decided only once. Rejection leaves the profile role unchanged. Client-side
role metadata is never used to authorize access.

### Create the first administrator

There is deliberately no admin-registration flow in the app. After applying
all migrations, create an account normally, then use the Supabase project
owner's SQL Editor to promote that account exactly once. Replace the email
below with the email of the account you control and verify that the update
reports one row:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where lower(email) = lower('YOUR_ADMIN_EMAIL')
)
and role = 'seeker';
```

Do not run this query from the app or expose SQL Editor credentials, database
passwords, or a service-role key. The SQL Editor uses trusted database-owner
privileges; authenticated clients cannot change their own role. Sign out and
back in after promotion so the app reloads the database role. Create any
additional administrators only through an equally trusted, audited SQL Editor
operation. Do not assign `admin` to an email unless you control that account.

Administrators can review pending Agent and Owner verification applications,
open an application to inspect the submitted profile information and documents,
and approve, reject with a reason, or request more information. The dashboard
also shows approved Agents and Owners, rejected applications, and previous
decisions. Admin document links are short-lived; verification files are stored
in a private `verification-documents` bucket. Applicants can access only files
inside their own user-ID folder.

To review a verification application:

1. Sign in with an account whose `profiles.role` is `admin`.
2. Open **User Role Requests** in the Admin dashboard and select the Pending
   Agent or Pending Owner section.
3. Open an application, check the legal name, contact details, credentials or
   property address, and use the document links to inspect the submitted
   evidence.
4. Approve only after completing the applicable manual checks. Otherwise,
   reject with a reason or request the missing information.
5. The applicant can see the decision or request in their account. Approval
   sets the approved profile role and `is_verified`; only verified Agent/Owner
   accounts can create or update listings under the listing RLS policies.

Registration, verification, and basic property listings remain free. Status
and decision reasons are shown in-app; email and push notifications are not
configured by this project. The software cannot authenticate the person or
document, validate an agency or professional license with its issuer, prove
ownership or legal authority, or determine compliance with local real-estate
law. An administrator must perform those checks using appropriate official
sources and follow applicable privacy and retention requirements.

The verification migration does not delete or unpublish existing listings.
It does require verification for listing changes going forward, so an
unverified legacy listing owner may need approval before managing existing
listings. Review legacy listings and their owners before applying the migration
to a production project.

## Validation and deployment

Run `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web`
before deployment. The app cannot connect until a Supabase project is created,
the migration is applied, and local environment variables are configured.
Email delivery, recovery redirects, and any desired OAuth providers must also
be configured in the Supabase dashboard. Legal pages, notifications, support
operations, and production monitoring still need product-specific setup.
