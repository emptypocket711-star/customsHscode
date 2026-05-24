export const DEVELOPER_EMAIL = "emptypocket711@gmail.com";

export function isDeveloperEmail(email?: string | null) {
  return email?.trim().toLowerCase() === DEVELOPER_EMAIL;
}
