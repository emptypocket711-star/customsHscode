export function isSelectedOrLaterStatus(status: string) {
  return status === "partner_selected" || status === "in_progress" || status === "completed";
}
