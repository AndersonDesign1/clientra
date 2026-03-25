export function maskEmailAddress(email: string) {
  const [localPart = "", domainPart = ""] = email.split("@");
  const [domainName = "", ...domainSuffixParts] = domainPart.split(".");
  const domainSuffix = domainSuffixParts.join(".");

  if (!(localPart && domainName && domainSuffix)) {
    return email;
  }

  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] ?? ""}*`
      : `${localPart.slice(0, 2)}${"*".repeat(localPart.length - 2)}`;
  const maskedDomain =
    domainName.length <= 1
      ? "*"
      : `${domainName[0]}${"*".repeat(domainName.length - 1)}`;

  return `${maskedLocal}@${maskedDomain}.${domainSuffix}`;
}
