alter table public.account_access_events
  drop constraint if exists account_access_events_type_check;

alter table public.account_access_events
  add constraint account_access_events_type_check check (
    event_type in (
      'login_success',
      'login_failure',
      'signup_otp_requested',
      'signup_email_verified',
      'signup_completed',
      'password_reset_requested',
      'password_updated',
      'sign_out'
    )
  );
