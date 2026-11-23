const ADMIN_UID = "BkohLox5U1PGIn9H8ZV8giTsysm1";
const ADMIN_EMAILS = ["alexandre.ranson@gmail.com", "doug.benchetrit@gmail.com"];

export function isAdminUser(user) {
  return Boolean(user && (user.uid === ADMIN_UID || ADMIN_EMAILS.includes(user.email)));
}
