import SignupForm from "./SignupForm";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { username?: string };
}) {
  const initial = (searchParams.username || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  return <SignupForm initialUsername={initial} />;
}
